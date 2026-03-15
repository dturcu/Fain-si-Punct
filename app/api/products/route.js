import { connectDB } from '@/lib/db'
import Product from '@/models/Product'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || '-createdAt'

    let query = {}

    if (category) {
      query.category = category
    }

    if (search) {
      query.$text = { $search: search }
    }

    const skip = (page - 1) * limit

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Product.countDocuments(query)

    return Response.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
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

    const product = await Product.create(body)

    return Response.json(
      { success: true, data: product },
      { status: 201 }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}
