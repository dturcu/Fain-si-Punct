import { supabaseAdmin } from '@/lib/supabase'
import { getCartByUserId, getUserById, getCartByGuestSession, getOrderById } from '@/lib/supabase-queries'
import { getSessionContext } from '@/lib/auth'
import { addEmailJob } from '@/lib/job-queue'
import { orderConfirmation } from '@/lib/templates/orderConfirmation'
import { SHIPPING_THRESHOLD, SHIPPING_COST, MAX_QUANTITY_PER_ITEM } from '@/lib/constants'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'
import { randomUUID } from 'crypto'

function generateOrderNumber() {
  return 'ORD-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
}

export async function POST(request) {
  try {
    const session = getSessionContext(request)

    if (!session.userId && !session.guestSessionId) {
      return apiError(ERROR_CODES.UNAUTHORIZED)
    }

    const { shippingAddress, customer, paymentMethod } = await request.json()

    // Validate customer fields
    if (!customer?.name || !customer.name.trim()) {
      return apiError(ERROR_CODES.MISSING_FIELD, { details: 'customer.name is required' })
    }
    if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return apiError(ERROR_CODES.INVALID_EMAIL)
    }
    if (!customer?.phone) {
      return apiError(ERROR_CODES.INVALID_PHONE)
    }

    // Validate shipping address fields
    const requiredAddressFields = ['street', 'city', 'state', 'zip']
    for (const field of requiredAddressFields) {
      if (!shippingAddress?.[field] || !shippingAddress[field].trim()) {
        return apiError(ERROR_CODES.MISSING_FIELD, { details: `shippingAddress.${field} is required` })
      }
    }

    // Validate payment method
    const validPaymentMethods = ['card', 'revolut', 'paypal', 'ramburs']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return apiError(ERROR_CODES.INVALID_PAYMENT_METHOD)
    }

    // Get cart (authenticated or guest)
    const cart = session.userId
      ? await getCartByUserId(session.userId)
      : await getCartByGuestSession(session.guestSessionId)

    if (!cart || !cart.items || cart.items.length === 0) {
      return apiError(ERROR_CODES.CART_EMPTY)
    }

    // Enforce per-item quantity cap at checkout too
    for (const item of cart.items) {
      if (item.quantity > MAX_QUANTITY_PER_ITEM) {
        return apiError(ERROR_CODES.QUANTITY_EXCEEDS_MAX)
      }
    }

    // Re-validate prices from DB before passing to RPC
    for (const item of cart.items) {
      if (item.variantId) {
        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('price_override, product_id')
          .eq('id', item.variantId)
          .single()
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('price')
          .eq('id', item.productId)
          .single()
        if (variant && product) {
          item.price = variant.price_override != null ? parseFloat(variant.price_override) : parseFloat(product.price)
        }
      } else {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('price')
          .eq('id', item.productId)
          .single()
        if (product) {
          item.price = parseFloat(product.price)
        }
      }
    }

    // Calculate subtotal from cart items and apply shipping
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const orderTotal = subtotal + shippingCost

    // Atomic checkout: stock decrement + order creation + cart clearing
    const orderNumber = generateOrderNumber()
    const rpcItems = cart.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      variantId: item.variantId || null,
      variantLabel: item.variantLabel || null,
    }))

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_checkout', {
      p_user_id: session.userId || null,
      p_guest_session_id: session.userId ? null : session.guestSessionId,
      p_items: rpcItems,
      p_customer: customer,
      p_shipping_address: shippingAddress,
      p_payment_method: paymentMethod || 'ramburs',
      p_order_number: orderNumber,
      p_total: orderTotal,
    })

    if (rpcError) {
      const msg = rpcError.message || ''
      if (msg.includes('Insufficient stock')) return apiError(ERROR_CODES.INSUFFICIENT_STOCK)
      if (msg.includes('not found')) return apiError(ERROR_CODES.PRODUCT_NOT_FOUND)
      console.error('[checkout] RPC error:', rpcError)
      return apiError(ERROR_CODES.CHECKOUT_FAILED)
    }

    const orderId = rpcResult.order_id
    const order = await getOrderById(orderId)

    const { ip, userAgent } = getRequestMeta(request)
    await logAuditEvent('order_created', {
      userId: session.userId || null,
      email: customer.email,
      ip,
      userAgent,
      metadata: {
        orderId,
        orderNumber,
        total: orderTotal,
        paymentMethod,
        guest: !session.userId,
      },
    })

    // Queue order confirmation email
    const shouldSendEmail = session.userId
      ? await (async () => {
          const user = await getUserById(session.userId)
          return user?.emailPreferences?.orderConfirmation !== false
        })()
      : true // Always send email for guest orders

    if (shouldSendEmail) {
      try {
        const emailHtml = orderConfirmation(order)
        const subject = `Order Confirmation - ${order.orderNumber}`

        const emailJob = await addEmailJob({
          type: 'order_confirmation',
          recipient: customer.email,
          subject,
          html: emailHtml,
          orderId: order.id,
          userId: session.userId || null,
          metadata: {
            orderNumber: order.orderNumber,
            customerName: customer.name,
          },
        })

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
      }
    }

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, 'checkout', ERROR_CODES.CHECKOUT_FAILED)
  }
}
