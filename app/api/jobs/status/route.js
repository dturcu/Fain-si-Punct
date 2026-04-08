import { NextResponse } from 'next/server'
import { getQueueStats, retryFailedJob, clearFailedJobs } from '@/lib/job-queue'
import { verifyAuth } from '@/lib/auth'

/**
 * GET /api/jobs/status
 * Get background job queue status (admin only)
 */
export async function GET(request) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuth(request.headers)
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const stats = await getQueueStats()

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Unable to fetch queue stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        queue_status: 'active',
        active_jobs: stats.active,
        waiting_jobs: stats.waiting,
        completed_jobs: stats.completed,
        failed_jobs: stats.failed,
        delayed_jobs: stats.delayed,
        recent_failures: stats.recent_failures.map((job) => ({
          id: job.id,
          type: job.data?.type || 'unknown',
          recipient: job.data?.recipient || 'unknown',
          error: job.failedReason,
          failed_at: job.failedOn,
          attempts: job.attemptsMade,
          max_attempts: job.opts.attempts,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching queue status:', error)
    return NextResponse.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jobs/status
 * Retry failed job or clear failed jobs (admin only)
 *
 * Request body:
 * {
 *   "action": "retry" | "clear_failed",
 *   "jobId": "job-id" (required for retry action)
 * }
 */
export async function POST(request) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuth(request.headers)
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, jobId } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action required (retry or clear_failed)' },
        { status: 400 }
      )
    }

    if (action === 'retry') {
      if (!jobId) {
        return NextResponse.json(
          { success: false, error: 'jobId required for retry action' },
          { status: 400 }
        )
      }

      try {
        const job = await retryFailedJob(jobId)
        return NextResponse.json({
          success: true,
          message: `Job ${jobId} queued for retry`,
          data: {
            job_id: job.id,
            status: job._progress,
          },
        })
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 404 }
        )
      }
    } else if (action === 'clear_failed') {
      await clearFailedJobs()
      return NextResponse.json({
        success: true,
        message: 'Failed jobs cleared',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing job action:', error)
    return NextResponse.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}
