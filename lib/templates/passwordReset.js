export function passwordReset(resetLink, expiresIn = '1 hour') {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #fff; padding: 30px 20px; border: 1px solid #eee; }
        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .alert-box p { margin: 5px 0; color: #856404; }
        .reset-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; margin: 30px 0; font-weight: 600; font-size: 16px; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .info-box h3 { margin-top: 0; color: #667eea; }
        .info-box ol { margin: 10px 0; padding-left: 20px; }
        .info-box li { margin: 8px 0; }
        .security-notice { background: #f0f8ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .security-notice p { margin: 5px 0; font-size: 14px; color: #333; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none; }
        .footer p { margin: 5px 0; }
        .unsubscribe { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure account access recovery</p>
        </div>

        <div class="content">
          <p>Hi there,</p>
          <p>We received a request to reset the password for your Fain si Punct account. If you didn't make this request, please disregard this email.</p>

          <div class="alert-box">
            <p><strong>⚠️ Important:</strong> This link expires in ${expiresIn}. Act quickly!</p>
          </div>

          <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">Reset Password</a>
          </div>

          <p style="color: #666; font-size: 14px; text-align: center;">Or copy and paste this link in your browser:<br><span style="word-break: break-all; color: #999;">${resetLink}</span></p>

          <div class="info-box">
            <h3>If the link doesn't work:</h3>
            <ol>
              <li>Copy the link above and paste it into your browser's address bar</li>
              <li>Or visit our password reset page and enter your email address</li>
              <li>We'll send you a new reset link</li>
            </ol>
          </div>

          <div class="security-notice">
            <p><strong>🔒 Security Information:</strong></p>
            <p>For your security, never share your password reset link with anyone. Fain si Punct staff will never ask for your password or reset link.</p>
            <p>If you don't recognize this request, your account may be compromised. Please contact our support team immediately.</p>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">This email was sent to you because a password reset was requested. If you didn't request this, you can ignore this email.</p>
        </div>

        <div class="footer">
          <p><strong>Fain si Punct</strong></p>
          <p>© 2026 Fain si Punct. All rights reserved.</p>
          <p><a href="${process.env.NEXT_PUBLIC_API_URL || 'https://example.com'}/account/preferences" class="unsubscribe">Manage Email Preferences</a> | <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://example.com'}" class="unsubscribe">Visit Our Store</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}
