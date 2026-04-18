export function orderObjToRow(body) {
  return {
    user_id: body.userId,
    total: body.total,
    status: body.status || 'pending',
    customer_name: body.customer?.name,
    customer_email: body.customer?.email,
    customer_phone: body.customer?.phone,
    shipping_street: body.shippingAddress?.street,
    shipping_city: body.shippingAddress?.city,
    shipping_state: body.shippingAddress?.state,
    shipping_zip: body.shippingAddress?.zip,
    shipping_country: body.shippingAddress?.country,
    payment_method: body.paymentMethod,
  }
}
