export function shippingUpdate(order, trackingNumber, trackingUrl) {
  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5)

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
        .status-box { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .status-box h2 { margin: 0; color: white; font-size: 24px; }
        .tracking-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
        .tracking-info p { margin: 10px 0; }
        .label { font-weight: 600; color: #667eea; }
        .tracking-number { font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #333; margin: 10px 0; }
        .timeline { position: relative; padding: 20px 0; margin: 20px 0; }
        .timeline-item { display: flex; margin: 15px 0; }
        .timeline-dot { width: 20px; height: 20px; background: #667eea; border-radius: 50%; margin-right: 20px; margin-top: 2px; flex-shrink: 0; }
        .timeline-dot.completed { background: #84fab0; }
        .timeline-content h4 { margin: 0 0 5px 0; color: #333; }
        .timeline-content p { margin: 0; color: #666; font-size: 14px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none; }
        .footer p { margin: 5px 0; }
        .unsubscribe { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order is Shipping!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Get ready to receive your package</p>
        </div>

        <div class="content">
          <p>Hi ${order.customer?.name || 'Valued Customer'},</p>
          <p>Great news! Your order is on its way. We're excited for you to receive it.</p>

          <div class="status-box">
            <h2>📦 In Transit</h2>
            <p style="margin: 10px 0 0 0;">Estimated Delivery: ${estimatedDelivery.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="tracking-info">
            <p><span class="label">Order Number:</span> ${order.orderNumber}</p>
            <p><span class="label">Tracking Number:</span></p>
            <div class="tracking-number">${trackingNumber}</div>
            <a href="${trackingUrl}" class="cta-button">Track Your Package</a>
          </div>

          <h3 style="color: #333;">Delivery Timeline</h3>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot completed"></div>
              <div class="timeline-content">
                <h4>Order Confirmed</h4>
                <p>${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot completed"></div>
              <div class="timeline-content">
                <h4>Shipped</h4>
                <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h4>In Transit</h4>
                <p>On its way to you</p>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h4>Delivered</h4>
                <p>Estimated ${estimatedDelivery.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #667eea;">📍 Shipping To</h4>
            <p style="margin: 5px 0; color: #333;">
              ${order.shippingAddress?.street}<br>
              ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zip}<br>
              ${order.shippingAddress?.country}
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">Click the button above to view real-time tracking information and get updates on your delivery status. If you have any issues, please contact our support team.</p>
        </div>

        <div class="footer">
          <p><strong>ShopHub</strong></p>
          <p>© 2026 ShopHub. All rights reserved.</p>
          <p><a href="${process.env.NEXT_PUBLIC_API_URL || 'https://example.com'}/account/preferences" class="unsubscribe">Manage Email Preferences</a> | <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://example.com'}" class="unsubscribe">Visit Our Store</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}
