import { supabaseAdmin } from '@/lib/supabase'
import { getUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

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

    // Bounded input — even admin-authenticated. Prevents DoS and limits
    // xlsx/CSV parser exposure. 10 MB is plenty for ~15k-row manifests.
    const MAX_IMPORT_BYTES = 10 * 1024 * 1024
    if (typeof file.size === 'number' && file.size > MAX_IMPORT_BYTES) {
      return Response.json(
        { success: false, error: 'File too large (max 10 MB)' },
        { status: 413 }
      )
    }

    // Mime-type allowlist: CSV variants and Excel workbooks.
    const allowedTypes = new Set([
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', // some browsers send this for .csv
      '', // formData files sometimes have empty type
    ])
    if (file.type && !allowedTypes.has(file.type)) {
      return Response.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 }
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
        // Parse CSV respecting quoted fields (handles commas inside quoted values)
        const fields = []
        let current = ''
        let inQuotes = false
        for (const char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            fields.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        fields.push(current.trim())

        const [name, price, category, stock, description, image, sku] = fields

        if (!name || !price || !category) {
          errors.push(`Row ${i + 2}: Missing required fields (name, price, category)`)
          errorCount++
          continue
        }

        const parsedPrice = parseFloat(price)
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          errors.push(`Row ${i + 2}: Invalid price "${price}"`)
          errorCount++
          continue
        }

        const parsedStock = parseInt(stock, 10)
        if (stock !== undefined && stock !== '' && isNaN(parsedStock)) {
          errors.push(`Row ${i + 2}: Invalid stock value "${stock}"`)
          errorCount++
          continue
        }

        const product = {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          price: parsedPrice,
          category,
          stock: isNaN(parsedStock) ? 0 : Math.max(0, parsedStock),
          description: description || '',
          image: image || '',
          sku: sku || `SKU-${randomBytes(4).toString('hex').toUpperCase()}`,
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
            errors.push(`Row ${i + 2}: update failed`)
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
            errors.push(`Row ${i + 2}: insert failed`)
            errorCount++
          } else {
            successCount++
          }
        }
      } catch (error) {
        console.error('admin/products/import error:', error)
        errors.push(`Row ${i + 2}: processing failed`)
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
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}
