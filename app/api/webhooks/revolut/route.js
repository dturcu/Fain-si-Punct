import { supabaseAdmin } from '@/lib/supabase'
import { verifyRevolutWebhook } from '@/lib/revolut'

async function restoreStock(orderId) {
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (!items || items.length === 0) return

  for (const item of items) {
    await supabaseAdmin.rpc('increment_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })
  }
}

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('revolut-signature') || ''

    if (!verifyRevolutWebhook(body, signature)) {
      return Response.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    console.log('Revolut webhook event:', event.event, event.order_id)

    if (event.event === 'ORDER_COMPLETED' || event.event === 'ORDER_AUTHORISED') {
      const revolutOrderId = event.order_id
      const webhookAmount = event.order_amount // amount in minor units (bani)

      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('id, status, payment_status, total')
        .eq('payment_provider_id', revolutOrderId)
        .single()

      if (order && !error) {
        // Idempotency check
        if (order.payment_status === 'paid') {
          console.log(`Order ${order.id} already paid (idempotent Revolut webhook)`)
          return Response.json({ received: true })
        }

        // Amount validation: compare webhook amount (bani) with stored order total (RON)
        if (webhookAmount !== undefined) {
          const storedAmountBani = Math.round(order.total * 100)
          if (webhookAmount !== storedAmountBani) {
            console.error(
              `Revolut amount mismatch for order ${order.id}: expected ${storedAmountBani} bani, got ${webhookAmount} bani`
            )
            return Response.json({ received: true })
          }
        }

        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            status: order.status === 'pending' ? 'processing' : order.status,
          })
          .eq('id', order.id)

        console.log(`Order ${order.id} marked as paid via Revolut webhook`)
      }
    } else if (event.event === 'ORDER_PAYMENT_FAILED') {
      const revolutOrderId = event.order_id

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, payment_status')
        .eq('payment_provider_id', revolutOrderId)
        .single()

      if (order) {
        // Idempotency check
        if (order.payment_status === 'failed') {
          console.log(`Order ${order.id} already failed (idempotent Revolut webhook)`)
          return Response.json({ received: true })
        }

        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order.id)

        // Restore stock for failed payment
        try {
          await restoreStock(order.id)
          console.log(`Stock restored for failed Revolut payment on order ${order.id}`)
        } catch (stockError) {
          console.error('Failed to restore stock for Revolut payment failure:', stockError)
        }
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Revolut webhook error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
