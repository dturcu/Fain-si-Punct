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

    const { emailLogId } = await request.json()

    if (!emailLogId) {
      return Response.json(
        { success: false, error: 'Missing emailLogId' },
        { status: 400 }
      )
    }

    // Find the email log entry
    const { data: emailLog, error: fetchError } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .single()

    if (fetchError || !emailLog) {
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
    const { error: updateError } = await supabaseAdmin
      .from('email_logs')
      .update({
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        message_id: result.messageId,
        sent_at: result.timestamp,
        retry_count: (emailLog.retry_count || 0) + 1,
      })
      .eq('id', emailLogId)

    if (updateError) throw updateError

    return Response.json({
      success: true,
      data: {
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        retryCount: (emailLog.retry_count || 0) + 1,
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
