import { connectDB } from '@/lib/db'
import Order from '@/models/Order'

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const status = searchParams.get('status')

    let query = {}

    if (email) {
      query['customer.email'] = email
    }

    if (status) {
      query.status = status
    }

    const orders = await Order.find(query).sort('-createdAt')

    return Response.json({ success: true, data: orders })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()

    const order = await Order.create({
      ...body,
      orderNumber: generateOrderNumber(),
    })

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}
