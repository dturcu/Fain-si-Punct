import { supabaseAdmin } from '@/lib/supabase'
import { getCartByUserId, clearCart, getUserById, createOrder } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { addEmailJob } from '@/lib/job-queue'
import { orderConfirmation } from '@/lib/templates/orderConfirmation'
import { applyRateLimit } from '@/middleware/rate-limit'
import { randomBytes } from 'crypto'

function generateOrderNumber() {
  return 'ORD-' + randomBytes(6).toString('hex').toUpperCase()
}

export async function POST(request) {
  const limited = applyRateLimit(request, 'checkout')
  if (limited) return limited

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

    const { shippingAddress, customer, paymentMethod } = await request.json()

    // Validate customer fields
    if (!customer?.name || !customer.name.trim()) {
      return Response.json(
        { success: false, error: 'Numele clientului este obligatoriu' },
        { status: 400 }
      )
    }
    if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return Response.json(
        { success: false, error: 'Adresa de email nu este valida' },
        { status: 400 }
      )
    }
    if (!customer?.phone) {
      return Response.json(
        { success: false, error: 'Numarul de telefon este obligatoriu' },
        { status: 400 }
      )
    }

    // Validate shipping address fields
    const requiredAddressFields = ['street', 'city', 'state', 'zip']
    for (const field of requiredAddressFields) {
      if (!shippingAddress?.[field] || !shippingAddress[field].trim()) {
        const fieldLabels = { street: 'Strada', city: 'Orasul', state: 'Judetul', zip: 'Codul postal' }
        return Response.json(
          { success: false, error: `${fieldLabels[field]} este obligatoriu/obligatorie` },
          { status: 400 }
        )
      }
    }

    // Validate payment method
    const validPaymentMethods = ['card', 'revolut', 'paypal', 'ramburs']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return Response.json(
        { success: false, error: 'Metoda de plata selectata nu este valida' },
        { status: 400 }
      )
    }

    // Get user's cart
    const cart = await getCartByUserId(decoded.userId)
    if (!cart || !cart.items || cart.items.length === 0) {
      return Response.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Check stock availability and capture current prices before deducting
    const currentPrices = {}
    const currentStocks = {}
    for (const item of cart.items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock, name, price')
        .eq('id', item.productId)
        .single()

      if (!product || product.stock < item.quantity) {
        const productName = product?.name || item.name || item.productId
        return Response.json(
          { success: false, error: `Produsul ${productName} nu mai este disponibil in cantitatea solicitata` },
          { status: 400 }
        )
      }
      currentPrices[item.productId] = product.price
      currentStocks[item.productId] = product.stock
    }

    // Atomically deduct stock using optimistic locking: only update if stock unchanged since read.
    // If another concurrent checkout modified stock first, data will be null and we abort.
    const deducted = []
    for (const item of cart.items) {
      const originalStock = currentStocks[item.productId]
      const { data: updated } = await supabaseAdmin
        .from('products')
        .update({ stock: originalStock - item.quantity })
        .eq('id', item.productId)
        .eq('stock', originalStock) // only update if stock hasn't changed (optimistic lock)
        .select('id')
        .single()

      if (!updated) {
        // Another concurrent request beat us — restore already-deducted items and abort
        for (const prev of deducted) {
          await supabaseAdmin
            .from('products')
            .update({ stock: currentStocks[prev.productId] })
            .eq('id', prev.productId)
        }
        return Response.json(
          { success: false, error: 'Stocul s-a modificat. Te rugam sa verifici cosul si sa incerci din nou.' },
          { status: 409 }
        )
      }
      deducted.push(item)
    }

    // Calculate subtotal using current prices from DB, not stale cart prices
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (currentPrices[item.productId] ?? item.price) * item.quantity,
      0
    )
    const shippingCost = subtotal >= 200 ? 0 : 15.99
    const orderTotal = subtotal + shippingCost

    // Create order
    const orderNumber = generateOrderNumber()
    const order = await createOrder(
      decoded.userId,
      cart.items,
      orderTotal,
      customer,
      shippingAddress,
      orderNumber,
      paymentMethod || 'card'
    )

    // Get user for email preferences
    const user = await getUserById(decoded.userId)

    // Queue order confirmation email if user hasn't opted out
    if (user?.emailPreferences?.orderConfirmation !== false) {
      try {
        const emailHtml = orderConfirmation(order)
        const subject = `Order Confirmation - ${order.orderNumber}`

        const emailJob = await addEmailJob({
          type: 'order_confirmation',
          recipient: customer.email,
          subject,
          html: emailHtml,
          orderId: order.id,
          userId: decoded.userId,
          metadata: {
            orderNumber: order.orderNumber,
            customerName: customer.name,
          },
        })

        // Update order with email job tracking
        await supabaseAdmin
          .from('order_email_jobs')
          .insert({
            order_id: order.id,
            job_id: emailJob.id,
          })

        await supabaseAdmin
          .from('orders')
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq('id', order.id)

        console.log(`Email job queued for order ${order.id}:`, emailJob.id)
      } catch (emailError) {
        console.error('Failed to queue order confirmation email:', emailError)
        // Don't fail the order creation if email queuing fails
      }
    }

    // Clear cart
    await clearCart(decoded.userId)

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare la procesarea comenzii. Te rugăm să încerci din nou.' },
      { status: 500 }
    )
  }
}
