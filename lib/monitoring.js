/**
 * Application monitoring and metrics
 * Handles error tracking, logging, and performance monitoring
 */

/**
 * Initialize monitoring (Sentry configuration)
 * For production, integrate with Sentry.io
 */
export function initMonitoring() {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    // In production, integrate with Sentry
    // const * as Sentry = require("@sentry/nextjs")
    // Sentry.init({...})
    console.log('Monitoring initialized for production')
  }
}

/**
 * Capture exception for error tracking
 */
export function captureException(error, context = {}) {
  console.error('Exception captured:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })

  // In production with Sentry:
  // Sentry.captureException(error, { contexts: { ...context } })
}

/**
 * Capture message for event tracking
 */
export function captureMessage(message, level = 'info', context = {}) {
  const timestamp = new Date().toISOString()

  if (level === 'error') {
    console.error(`[${timestamp}] ${message}`, context)
  } else if (level === 'warn') {
    console.warn(`[${timestamp}] ${message}`, context)
  } else {
    console.log(`[${timestamp}] ${message}`, context)
  }

  // In production with Sentry:
  // Sentry.captureMessage(message, level)
}

/**
 * Performance monitoring decorator
 */
export function measurePerformance(functionName) {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args) {
      const startTime = Date.now()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime

        console.log(`[PERF] ${functionName} completed in ${duration}ms`)

        return result
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`[PERF] ${functionName} failed after ${duration}ms`, error.message)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  constructor() {
    this.metrics = new Map()
    this.counters = new Map()
    this.timings = new Map()
  }

  /**
   * Increment counter
   */
  incrementCounter(name, value = 1, labels = {}) {
    const key = this.getKey(name, labels)
    this.counters.set(key, (this.counters.get(key) || 0) + value)
  }

  /**
   * Record timing
   */
  recordTiming(name, duration, labels = {}) {
    const key = this.getKey(name, labels)

    if (!this.timings.has(key)) {
      this.timings.set(key, [])
    }

    this.timings.get(key).push(duration)
  }

  /**
   * Get metric statistics
   */
  getStatistics(name, labels = {}) {
    const key = this.getKey(name, labels)
    const timings = this.timings.get(key) || []

    if (timings.length === 0) {
      return null
    }

    const sorted = [...timings].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    const count = sorted.length

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      timings: Object.fromEntries(
        Array.from(this.timings.entries()).map(([key, values]) => [
          key,
          this.getStatistics(key),
        ])
      ),
    }
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.clear()
    this.counters.clear()
    this.timings.clear()
  }

  /**
   * Generate key from name and labels
   */
  getKey(name, labels = {}) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    return labelStr ? `${name}{${labelStr}}` : name
  }
}

/**
 * Global metrics instance
 */
export const metrics = new MetricsCollector()

/**
 * Health check object
 */
export const healthChecks = {
  database: { status: 'unknown', lastCheck: null },
  redis: { status: 'unknown', lastCheck: null },
  email: { status: 'unknown', lastCheck: null },
}

/**
 * Update health check status
 */
export function updateHealthCheck(service, status) {
  if (healthChecks[service]) {
    healthChecks[service] = {
      status,
      lastCheck: new Date().toISOString(),
    }
  }
}

/**
 * Get all health checks
 */
export function getHealthStatus() {
  const status = {
    healthy: true,
    checks: healthChecks,
    timestamp: new Date().toISOString(),
  }

  // Mark as unhealthy if any service is down
  for (const [service, check] of Object.entries(healthChecks)) {
    if (check.status === 'down') {
      status.healthy = false
    }
  }

  return status
}

export default {
  initMonitoring,
  captureException,
  captureMessage,
  metrics,
  healthChecks,
  updateHealthCheck,
  getHealthStatus,
}
