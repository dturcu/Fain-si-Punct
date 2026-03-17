import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getHealthStatus, updateHealthCheck } from '@/lib/monitoring'

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET(request) {
  try {
    const status = getHealthStatus()

    // Check database
    try {
      await connectDB()
      updateHealthCheck('database', 'up')
    } catch (error) {
      console.error('Database health check failed:', error.message)
      updateHealthCheck('database', 'down')
      status.healthy = false
    }

    // Return health status
    const statusCode = status.healthy ? 200 : 503

    return NextResponse.json(status, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/health/detailed
 * Detailed health check with metrics
 */
export async function GET_DETAILED(request) {
  try {
    const { metrics } = await import('@/lib/monitoring')

    const status = getHealthStatus()
    status.metrics = metrics.getAllMetrics()

    const statusCode = status.healthy ? 200 : 503

    return NextResponse.json(status, { status: statusCode })
  } catch (error) {
    console.error('Detailed health check error:', error)

    return NextResponse.json(
      {
        healthy: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
