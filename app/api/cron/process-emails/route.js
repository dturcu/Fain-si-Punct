import { Redis } from '@upstash/redis'
import { sendEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

const QUEUE_KEY = 'email-jobs'
const FAILED_KEY = 'email-jobs:failed'
const COMPLETED_KEY = 'email-jobs:completed'
const JOB_PREFIX = 'email-job:'

// Max jobs to process per invocation (stay within serverless timeout)
const BATCH_SIZE = 10

/**
 * POST /api/cron/process-emails
 *
 * Processes queued email jobs from Upstash Redis.
 * Designed to be called by Vercel Cron or an external scheduler.
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request) {
  try {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let processed = 0
    let failed = 0
    let empty = false

    for (let i = 0; i < BATCH_SIZE; i++) {
      // Pop from the right (FIFO: lpush + rpop)
      const raw = await redis.rpop(QUEUE_KEY)
      if (!raw) {
        empty = true
        break
      }

      const job = typeof raw === 'string' ? JSON.parse(raw) : raw
      const { data } = job

      try {
        job.status = 'processing'
        job.attempts = (job.attempts || 0) + 1

        const result = await sendEmail(data.recipient, data.subject, data.html)

        if (result.success) {
          job.status = 'completed'
          job.completedAt = new Date().toISOString()
          job.messageId = result.messageId

          // Track completion
          await redis.lpush(COMPLETED_KEY, JSON.stringify(job))
          await redis.set(`${JOB_PREFIX}${job.id}`, JSON.stringify(job), { ex: 86400 })

          // Log to database
          try {
            await supabaseAdmin.from('email_logs').insert({
              recipient: data.recipient,
              type: data.type || 'general',
              subject: data.subject,
              order_id: data.orderId || null,
              user_id: data.userId || null,
              status: 'sent',
              message_id: result.messageId,
              sent_at: new Date().toISOString(),
              metadata: data.metadata || {},
            })
          } catch (logErr) {
            console.error('Email log insert failed:', logErr)
          }

          processed++
        } else {
          throw new Error(result.error || 'Send failed')
        }
      } catch (sendError) {
        job.status = 'failed'
        job.error = sendError.message
        job.failedAt = new Date().toISOString()

        if (job.attempts < (job.maxAttempts || 4)) {
          // Re-queue for retry
          await redis.lpush(QUEUE_KEY, JSON.stringify(job))
        } else {
          // Move to failed queue permanently
          await redis.lpush(FAILED_KEY, JSON.stringify(job))

          // Log failure to database
          try {
            await supabaseAdmin.from('email_logs').insert({
              recipient: data.recipient,
              type: data.type || 'general',
              subject: data.subject,
              order_id: data.orderId || null,
              user_id: data.userId || null,
              status: 'failed',
              error_message: sendError.message,
              retry_count: job.attempts,
              metadata: data.metadata || {},
            })
          } catch (logErr) {
            console.error('Email failure log insert failed:', logErr)
          }
        }

        await redis.set(`${JOB_PREFIX}${job.id}`, JSON.stringify(job), { ex: 86400 })
        failed++
      }
    }

    const remaining = await redis.llen(QUEUE_KEY) || 0

    return Response.json({
      success: true,
      processed,
      failed,
      remaining,
      empty,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email worker error:', error)
    return Response.json(
      { success: false, error: 'Worker execution failed' },
      { status: 500 }
    )
  }
}
