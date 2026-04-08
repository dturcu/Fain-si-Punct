import { supabaseAdmin } from '@/lib/supabase'
import { verifyRevolutWebhook } from '@/lib/revolut'

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('revolut-signature') || ''

    // Verify webhook signature
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

      // Find our order by revolut payment ID
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('payment_provider_id', revolutOrderId)
        .single()

      if (order && !error) {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            status: order.status === 'pending' ? 'processing' : order.status,
          })
          .eq('id', order.id)

        console.log(`Order ${order.id} marked as paid via Revolut webhook`)
      }
    } else if (event.event === 'ORDER_PAYMENT_FAILED') {
      const revolutOrderId = event.order_id

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('payment_provider_id', revolutOrderId)
        .single()

      if (order) {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order.id)
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Revolut webhook error:', error)
    return Response.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
