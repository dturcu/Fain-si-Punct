import { supabaseAdmin } from '@/lib/supabase'
import { getUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request) {
  try {
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
    const user = await getUserById(decoded.userId)
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
    const { data: emailLog, error } = await supabaseAdmin
      .from('email_logs')
      .insert({
        recipient: to,
        type,
        subject,
        order_id: orderId,
        user_id: recipientUserId,
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        message_id: result.messageId,
        sent_at: result.timestamp,
        metadata,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({
      success: true,
      data: {
        messageId: result.messageId,
        logId: emailLog.id,
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
