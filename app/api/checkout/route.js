import { supabaseAdmin } from '@/lib/supabase'
import { getCartByUserId, getUserById, getCartByGuestSession, getOrderById } from '@/lib/supabase-queries'
import { getSessionContext } from '@/lib/auth'
import { addEmailJob } from '@/lib/job-queue'
import { orderConfirmation } from '@/lib/templates/orderConfirmation'
import { SHIPPING_THRESHOLD, SHIPPING_COST, MAX_QUANTITY_PER_ITEM } from '@/lib/constants'
import { randomUUID } from 'crypto'

function generateOrderNumber() {
  return 'ORD-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
}

export async function POST(request) {
  try {
    const session = getSessionContext(request)

    if (!session.userId && !session.guestSessionId) {
      return Response.json(
        { success: false, error: 'No session found' },
        { status: 400 }
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

    // Get cart (authenticated or guest)
    const cart = session.userId
      ? await getCartByUserId(session.userId)
      : await getCartByGuestSession(session.guestSessionId)

    if (!cart || !cart.items || cart.items.length === 0) {
      return Response.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Enforce per-item quantity cap at checkout too
    for (const item of cart.items) {
      if (item.quantity > MAX_QUANTITY_PER_ITEM) {
        return Response.json(
          { success: false, error: `Cantitatea maximă per produs este ${MAX_QUANTITY_PER_ITEM}` },
          { status: 400 }
        )
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
      // Surface stock/product errors from the DB function
      const msg = rpcError.message || 'Checkout failed'
      const isStockError = msg.includes('Insufficient stock') || msg.includes('not found')
      return Response.json(
        { success: false, error: isStockError ? msg : 'A aparut o eroare la finalizarea comenzii' },
        { status: isStockError ? 400 : 500 }
      )
    }

    const orderId = rpcResult.order_id
    const order = await getOrderById(orderId)

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
    console.error('Checkout error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare la finalizarea comenzii' },
      { status: 500 }
    )
  }
}
