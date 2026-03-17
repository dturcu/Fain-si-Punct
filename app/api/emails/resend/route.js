import { connectDB } from '@/lib/db'
import { verifyToken, getCookieToken } from '@/lib/auth'
import User from '@/models/User'
import EmailLog from '@/models/EmailLog'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/emails/resend
 * Resend a failed email
 */
export async function POST(request) {
  try {
    await connectDB()

    const token = getCookieToken(request)
    if (!token) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { emailLogId } = await request.json()

    if (!emailLogId) {
      return Response.json(
        { success: false, error: 'Missing emailLogId' },
        { status: 400 }
      )
    }

    // Find the email log entry
    const emailLog = await EmailLog.findById(emailLogId)
    if (!emailLog) {
      return Response.json(
        { success: false, error: 'Email log not found' },
        { status: 404 }
      )
    }

    // Resend the email
    const result = await sendEmail(
      emailLog.recipient,
      emailLog.subject,
      emailLog.metadata?.htmlContent || `<p>${emailLog.subject}</p>`,
      emailLog.metadata
    )

    // Update the email log
    emailLog.status = result.success ? 'sent' : 'failed'
    emailLog.error = result.error || null
    emailLog.messageId = result.messageId
    emailLog.sentAt = result.timestamp
    emailLog.retryCount = (emailLog.retryCount || 0) + 1

    await emailLog.save()

    return Response.json({
      success: true,
      data: {
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        retryCount: emailLog.retryCount,
      },
    })
  } catch (error) {
    console.error('Resend email error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
