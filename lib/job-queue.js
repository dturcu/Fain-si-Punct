import Queue from 'bull'
import redis from 'redis'

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis connected')
})

// Create email job queue
const emailQueue = new Queue('email-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: parseInt(process.env.EMAIL_MAX_RETRIES || '4'),
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, exponential backoff
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: false, // Keep failed jobs for debugging
  },
})

// Queue event handlers
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`)
})

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message)
})

emailQueue.on('error', (err) => {
  console.error('Queue error:', err)
})

/**
 * Add email job to queue
 * @param {Object} data - Job data
 * @param {string} data.type - Email type (order_confirmation, shipping_update, password_reset, welcome)
 * @param {string} data.recipient - Email recipient
 * @param {string} data.subject - Email subject
 * @param {string} data.html - Email HTML content
 * @param {string} data.orderId - Order ID (for order emails)
 * @param {string} data.userId - User ID (for user emails)
 * @param {Object} data.metadata - Custom metadata
 * @returns {Promise<Job>} Bull job object
 */
export async function addEmailJob(data) {
  try {
    const job = await emailQueue.add(data, {
      jobId: `${data.type}-${data.recipient}-${Date.now()}`,
    })
    console.log(`Email job added: ${job.id}`)
    return job
  } catch (error) {
    console.error('Error adding email job:', error)
    throw error
  }
}

/**
 * Process email jobs
 * @param {Function} handler - Job handler function
 */
export async function processEmailJobs(handler) {
  emailQueue.process(handler)
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  try {
    const counts = await emailQueue.getJobCounts()
    const failed = await emailQueue.getFailed(0, 10)
    return {
      active: counts.active,
      waiting: counts.waiting,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
      recent_failures: failed,
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
    await emailQueue.clean(0, 'failed')
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
    const job = await emailQueue.getJob(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }
    await job.retry()
    console.log(`Job ${jobId} queued for retry`)
    return job
  } catch (error) {
    console.error('Error retrying job:', error)
    throw error
  }
}

/**
 * Close queue (use on app shutdown)
 */
export async function closeQueues() {
  await emailQueue.close()
  redisClient.quit()
  console.log('Job queues closed')
}

export default emailQueue
