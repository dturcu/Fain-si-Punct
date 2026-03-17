export function orderConfirmation(order) {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 0; text-align: left;">${item.name}</td>
      <td style="padding: 12px 0; text-align: center;">Qty: ${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('')

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
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .order-info p { margin: 8px 0; }
        .label { font-weight: 600; color: #667eea; }
        .items-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
        .items-table th { text-align: left; padding: 12px 0; border-bottom: 2px solid #667eea; color: #667eea; font-weight: 600; }
        .total-section { margin: 20px 0; text-align: right; border-top: 2px solid #eee; padding-top: 20px; }
        .total-amount { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .shipping-address { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .shipping-address h3 { margin-top: 0; color: #667eea; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #eee; border-top: none; }
        .footer p { margin: 5px 0; }
        .unsubscribe { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
        </div>

        <div class="content">
          <p>Hi ${order.customer?.name || 'Valued Customer'},</p>
          <p>We're excited to confirm your order! Below are the details of your purchase.</p>

          <div class="order-info">
            <p><span class="label">Order Number:</span> ${order.orderNumber}</p>
            <p><span class="label">Order Date:</span> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><span class="label">Order Status:</span> ${order.status}</p>
          </div>

          <h3 style="color: #333; margin-top: 30px;">Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <p style="margin: 0; color: #666;">Subtotal: $${order.total.toFixed(2)}</p>
            <p style="margin: 5px 0; color: #666;">Shipping: Calculated at delivery</p>
            <div class="total-amount">Total: $${order.total.toFixed(2)}</div>
          </div>

          <div class="shipping-address">
            <h3>Shipping Address</h3>
            <p>${order.shippingAddress?.street}</p>
            <p>${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zip}</p>
            <p>${order.shippingAddress?.country}</p>
          </div>

          <p style="margin-top: 30px;">We'll send you a shipping confirmation once your order leaves our warehouse. You can track your order status anytime.</p>

          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://example.com'}/orders/${order._id}" class="cta-button">Track Your Order</a>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">If you have any questions about your order, please don't hesitate to contact our customer support team.</p>
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
