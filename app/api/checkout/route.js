import { supabaseAdmin } from '@/lib/supabase'
import { getCartByUserId, clearCart, getUserById, createOrder, getCartByGuestSession, clearGuestCart } from '@/lib/supabase-queries'
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

    // Decrement stock using optimistic locking and re-validate prices
    for (const item of cart.items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock, name, price')
        .eq('id', item.productId)
        .single()

      if (!product) {
        return Response.json(
          { success: false, error: `Produsul ${item.name || item.productId} nu mai este disponibil` },
          { status: 400 }
        )
      }

      // If variant, check variant stock and use variant price
      if (item.variantId) {
        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('id, stock, price_override')
          .eq('id', item.variantId)
          .single()

        if (!variant || variant.stock < item.quantity) {
          return Response.json(
            { success: false, error: `Varianta selectata pentru ${product.name} nu mai este disponibila in cantitatea solicitata` },
            { status: 400 }
          )
        }

        // Use variant price if set, otherwise product price
        item.price = variant.price_override != null ? parseFloat(variant.price_override) : parseFloat(product.price)

        // Optimistic lock on variant stock
        const { data: updatedVariant } = await supabaseAdmin
          .from('product_variants')
          .update({ stock: variant.stock - item.quantity })
          .eq('id', item.variantId)
          .eq('stock', variant.stock)
          .select('id')

        if (!updatedVariant || updatedVariant.length === 0) {
          return Response.json(
            { success: false, error: `Varianta selectata pentru ${product.name} nu mai este disponibila in cantitatea solicitata` },
            { status: 400 }
          )
        }
      } else {
        // No variant — use product-level stock
        if (product.stock < item.quantity) {
          return Response.json(
            { success: false, error: `Produsul ${product.name} nu mai este disponibil in cantitatea solicitata` },
            { status: 400 }
          )
        }

        // Price re-validation: always use the current DB price
        item.price = parseFloat(product.price)

        // Only update if stock hasn't changed since we read it (optimistic locking)
        const { data: updated } = await supabaseAdmin
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.productId)
          .eq('stock', product.stock)
          .select('id')

        if (!updated || updated.length === 0) {
          return Response.json(
            { success: false, error: `Produsul ${product.name} nu mai este disponibil in cantitatea solicitata` },
            { status: 400 }
          )
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

    // Create order
    const orderNumber = generateOrderNumber()
    const order = await createOrder(
      session.userId,
      cart.items,
      orderTotal,
      customer,
      shippingAddress,
      orderNumber,
      paymentMethod || 'card',
      session.userId ? null : session.guestSessionId
    )

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

    // Clear cart
    if (session.userId) {
      await clearCart(session.userId)
    } else {
      await clearGuestCart(session.guestSessionId)
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
