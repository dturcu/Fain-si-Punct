import { supabaseAdmin } from '@/lib/supabase'
import { getCartByUserId, clearCart, getUserById, createOrder } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { addEmailJob } from '@/lib/job-queue'
import { orderConfirmation } from '@/lib/templates/orderConfirmation'

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// Payment methods allowed for guest users
const GUEST_ALLOWED_PAYMENT_METHODS = ['card', 'ramburs']

export async function POST(request) {
  try {
    const token = getCookieToken(request)
    const body = await request.json()
    const { shippingAddress, customer, paymentMethod, guestItems } = body

    // --- Validate common fields ---

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

    // --- Determine guest vs authenticated mode ---

    let isGuest = false
    let userId = null
    let cartItems = null

    if (token) {
      // Authenticated flow
      const decoded = verifyToken(token)
      if (!decoded) {
        return Response.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        )
      }
      userId = decoded.userId

      // Validate payment method (all methods allowed for auth users)
      const validPaymentMethods = ['card', 'revolut', 'paypal', 'ramburs']
      if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
        return Response.json(
          { success: false, error: 'Metoda de plata selectata nu este valida' },
          { status: 400 }
        )
      }

      const cart = await getCartByUserId(userId)
      if (!cart || !cart.items || cart.items.length === 0) {
        return Response.json(
          { success: false, error: 'Cart is empty' },
          { status: 400 }
        )
      }
      cartItems = cart.items
    } else {
      // Guest flow
      isGuest = true

      if (!GUEST_ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
        return Response.json(
          { success: false, error: 'Metoda de plata selectata nu este disponibila pentru comenzile fara cont' },
          { status: 400 }
        )
      }

      if (!guestItems || !Array.isArray(guestItems) || guestItems.length === 0) {
        return Response.json(
          { success: false, error: 'Cosul este gol' },
          { status: 400 }
        )
      }

      // Validate each guest item against the DB (price integrity + existence)
      const validatedItems = []
      for (const item of guestItems) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return Response.json(
            { success: false, error: 'Date produs invalide in cos' },
            { status: 400 }
          )
        }

        const { data: product, error } = await supabaseAdmin
          .from('products')
          .select('id, name, price, stock')
          .eq('id', item.productId)
          .single()

        if (error || !product) {
          return Response.json(
            { success: false, error: `Produsul nu mai este disponibil` },
            { status: 400 }
          )
        }

        // Use DB price (ignore client-side price to prevent tampering)
        validatedItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: item.image || '',
        })
      }
      cartItems = validatedItems
    }

    // --- Stock check ---
    for (const item of cartItems) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock, name')
        .eq('id', item.productId)
        .single()

      if (!product || product.stock < item.quantity) {
        const productName = product?.name || item.name || item.productId
        return Response.json(
          { success: false, error: `Produsul ${productName} nu mai este disponibil in cantitatea solicitata` },
          { status: 400 }
        )
      }
    }

    // --- Deduct stock ---
    for (const item of cartItems) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single()

      if (product) {
        await supabaseAdmin
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.productId)
      }
    }

    // --- Calculate totals ---
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost = subtotal >= 200 ? 0 : 15.99
    const orderTotal = subtotal + shippingCost

    // --- Create order ---
    const orderNumber = generateOrderNumber()
    const order = await createOrder(
      userId, // null for guest orders
      cartItems,
      orderTotal,
      customer,
      shippingAddress,
      orderNumber,
      paymentMethod || 'card'
    )

    // --- Queue confirmation email ---
    // For authenticated users, check email preferences; for guests, always send
    let shouldSendEmail = true
    if (!isGuest) {
      const user = await getUserById(userId)
      if (user?.emailPreferences?.orderConfirmation === false) {
        shouldSendEmail = false
      }
    }

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
          userId: userId,
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
        // Don't fail the order creation if email queuing fails
      }
    }

    // --- Clear server-side cart for authenticated users ---
    if (!isGuest) {
      await clearCart(userId)
    }

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
