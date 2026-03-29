import { supabaseAdmin } from '@/lib/supabase'
import { getUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const token = getCookieToken(request)
    if (!token) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').slice(1) // Skip header

    const products = []
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      try {
        const [name, price, category, stock, description, image, sku] = lines[i]
          .split(',')
          .map((field) => field.trim())

        if (!name || !price || !category) {
          errors.push(`Row ${i + 2}: Missing required fields`)
          errorCount++
          continue
        }

        const product = {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          price: parseFloat(price),
          category,
          stock: parseInt(stock) || 0,
          description: description || '',
          image: image || '',
          sku: sku || `SKU-${Date.now()}-${Math.random()}`,
        }

        // Check if product with same SKU exists
        const { data: existingProduct } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('sku', product.sku)
          .single()

        if (existingProduct) {
          // Update existing product
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update(product)
            .eq('id', existingProduct.id)

          if (updateError) {
            errors.push(`Row ${i + 2}: ${updateError.message}`)
            errorCount++
          } else {
            successCount++
          }
        } else {
          // Create new product
          const { error: insertError } = await supabaseAdmin
            .from('products')
            .insert([product])

          if (insertError) {
            errors.push(`Row ${i + 2}: ${insertError.message}`)
            errorCount++
          } else {
            successCount++
          }
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`)
        errorCount++
      }
    }

    return Response.json({
      success: true,
      data: {
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Return first 10 errors
        totalErrors: errors.length,
      },
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
