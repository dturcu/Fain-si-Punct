import { Redis } from '@upstash/redis'

// Create Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

const QUEUE_KEY = 'email-jobs'
const FAILED_KEY = 'email-jobs:failed'
const COMPLETED_KEY = 'email-jobs:completed'
const JOB_PREFIX = 'email-job:'

/**
 * Add email job to queue
 */
export async function addEmailJob(data) {
  const jobId = `${data.type}-${data.recipient}-${Date.now()}`
  const job = {
    id: jobId,
    data,
    status: 'waiting',
    attempts: 0,
    maxAttempts: parseInt(process.env.EMAIL_MAX_RETRIES || '4'),
    createdAt: new Date().toISOString(),
  }

  await redis.lpush(QUEUE_KEY, JSON.stringify(job))
  await redis.set(`${JOB_PREFIX}${jobId}`, JSON.stringify(job), { ex: 86400 }) // 24h TTL

  console.log(`Email job added: ${jobId}`)
  return job
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  try {
    const waiting = await redis.llen(QUEUE_KEY) || 0
    const failedList = await redis.lrange(FAILED_KEY, 0, 9) || []
    const completedCount = await redis.llen(COMPLETED_KEY) || 0

    const recentFailures = failedList.map((item) => {
      const job = typeof item === 'string' ? JSON.parse(item) : item
      return {
        id: job.id,
        data: job.data,
        failedReason: job.error,
        failedOn: job.failedAt,
        attemptsMade: job.attempts,
        opts: { attempts: job.maxAttempts },
      }
    })

    return {
      active: 0,
      waiting,
      completed: completedCount,
      failed: failedList.length,
      delayed: 0,
      recent_failures: recentFailures,
    }
  } catch (error) {
    console.error('Error getting queue stats:', error)
    return null
  }
}

/**
 * Clear failed jobs
 */
export async function clearFailedJobs() {
  try {
    await redis.del(FAILED_KEY)
    console.log('Failed jobs cleared')
  } catch (error) {
    console.error('Error clearing failed jobs:', error)
  }
}

/**
 * Retry specific failed job
 */
export async function retryFailedJob(jobId) {
  try {
    const jobData = await redis.get(`${JOB_PREFIX}${jobId}`)
    if (!jobData) {
      throw new Error(`Job ${jobId} not found`)
    }

    const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData
    job.status = 'waiting'
    job.attempts = 0

    await redis.lpush(QUEUE_KEY, JSON.stringify(job))
    await redis.set(`${JOB_PREFIX}${jobId}`, JSON.stringify(job), { ex: 86400 })

    console.log(`Job ${jobId} queued for retry`)
    return job
  } catch (error) {
    console.error('Error retrying job:', error)
    throw error
  }
}

export default redis
