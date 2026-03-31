import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const BUCKET = 'product-images'

/**
 * POST /api/upload
 * Upload a product image to Supabase Storage.
 * Admin only. Returns the public URL.
 */
export async function POST(request) {
  try {
    // Admin auth
    const token = getCookieToken(request)
    if (!token) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }
    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { success: false, error: 'Tip de fisier neacceptat. Acceptam: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: 'Fisierul depaseste limita de 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop().toLowerCase()
    const filename = `${randomUUID()}.${ext}`
    const path = `products/${filename}`

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return Response.json(
        { success: false, error: 'Eroare la incarcarea fisierului' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path)

    return Response.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: data.path,
        filename,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}
