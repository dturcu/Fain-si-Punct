export function welcome(userName) {
  const firstName = userName?.split(' ')[0] || 'there'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 36px; font-weight: 300; letter-spacing: 1px; }
        .header p { margin: 15px 0 0 0; opacity: 0.95; font-size: 18px; }
        .content { background: #fff; padding: 40px 30px; border: 1px solid #eee; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 40px 0; }
        .feature { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .feature-icon { font-size: 32px; margin-bottom: 10px; }
        .feature h4 { margin: 10px 0; color: #667eea; }
        .feature p { margin: 0; font-size: 14px; color: #666; }
        .cta-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 6px; margin: 30px 0; text-align: center; }
        .cta-section h2 { margin: 0 0 10px 0; }
        .cta-section p { margin: 0 0 20px 0; }
        .cta-button { display: inline-block; background: white; color: #667eea; padding: 12px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .benefit-list { margin: 20px 0; }
        .benefit-item { display: flex; margin: 12px 0; }
        .benefit-icon { margin-right: 15px; font-size: 20px; flex-shrink: 0; }
        .benefit-text { margin: 0; color: #333; }
        .account-info { background: #f0f8ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
        .account-info h4 { margin-top: 0; color: #667eea; }
        .account-info p { margin: 8px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none; }
        .footer p { margin: 5px 0; }
        .unsubscribe { color: #667eea; text-decoration: none; }
        @media (max-width: 480px) {
          .feature-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome, ${firstName}! 🎉</h1>
          <p>Your shopping adventure begins now</p>
        </div>

        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Thank you for joining Fain si Punct! We're thrilled to have you as part of our community. Whether you're looking for quality products, great deals, or simply the best shopping experience, you've come to the right place.</p>

          <div class="cta-section">
            <h2>Ready to Shop?</h2>
            <p>Explore our curated collection of products from top brands</p>
            <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://example.com'}/products" class="cta-button">Start Shopping</a>
          </div>

          <h3 style="color: #333; margin-top: 40px;">Here's what you can do on Fain si Punct:</h3>
          <div class="benefit-list">
            <div class="benefit-item">
              <div class="benefit-icon">🛍️</div>
              <p class="benefit-text">Browse thousands of products across multiple categories</p>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">⭐</div>
              <p class="benefit-text">Read reviews and ratings from verified customers like you</p>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">🛒</div>
              <p class="benefit-text">Build your cart and checkout securely with multiple payment methods</p>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">📦</div>
              <p class="benefit-text">Track your orders in real-time with shipping updates</p>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">🎁</div>
              <p class="benefit-text">Receive exclusive offers and deals in your inbox</p>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">👤</div>
              <p class="benefit-text">Manage your account and preferences anytime</p>
            </div>
          </div>

          <div class="account-info">
            <h4>Account Setup Tips</h4>
            <p><strong>1. Complete Your Profile:</strong> Add your full name and address for faster checkout</p>
            <p><strong>2. Save Payment Methods:</strong> Securely store your payment info for one-click checkout</p>
            <p><strong>3. Manage Preferences:</strong> Customize which emails you receive from us</p>
            <p><strong>4. Join Our Newsletter:</strong> Get updates on new products, sales, and exclusive offers</p>
          </div>

          <p style="color: #666; margin: 30px 0;">If you have any questions or need help getting started, our customer support team is here to assist. Just reply to this email or visit our help center.</p>

          <p style="color: #999; font-size: 12px;">We're committed to providing you with the best shopping experience. Happy shopping!</p>
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
