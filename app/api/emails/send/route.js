import { connectDB } from '@/lib/db'
import { verifyToken, getCookieToken } from '@/lib/auth'
import User from '@/models/User'
import EmailLog from '@/models/EmailLog'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/emails/send
 * Admin route to manually send email
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

    const { to, subject, htmlContent, type, orderId, userId: recipientUserId, metadata } = await request.json()

    if (!to || !subject || !htmlContent || !type) {
      return Response.json(
        { success: false, error: 'Missing required fields: to, subject, htmlContent, type' },
        { status: 400 }
      )
    }

    // Send the email
    const result = await sendEmail(to, subject, htmlContent, metadata)

    // Log the email
    const emailLog = await EmailLog.create({
      recipient: to,
      type,
      subject,
      orderId,
      userId: recipientUserId,
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
      messageId: result.messageId,
      sentAt: result.timestamp,
      metadata,
    })

    return Response.json({
      success: true,
      data: {
        messageId: result.messageId,
        logId: emailLog._id,
        status: result.success ? 'sent' : 'failed',
      },
    })
  } catch (error) {
    console.error('Send email error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
