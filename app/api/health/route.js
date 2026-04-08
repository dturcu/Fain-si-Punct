import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    // Check Supabase connection
    const { data, error } = await supabaseAdmin.from('products').select('id').limit(1)

    if (error) {
      return NextResponse.json(
        {
          healthy: false,
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        healthy: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        healthy: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
