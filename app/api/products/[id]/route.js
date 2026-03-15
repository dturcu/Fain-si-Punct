import { connectDB } from '@/lib/db'
import Product from '@/models/Product'

export async function GET(request, { params }) {
  try {
    await connectDB()

    const product = await Product.findById(params.id)

    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: product })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()

    const body = await request.json()

    const product = await Product.findByIdAndUpdate(params.id, body, {
      new: true,
    })

    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: product })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const product = await Product.findByIdAndDelete(params.id)

    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: product })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
