import { getAWBStatus } from '@/lib/sameday'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const awb = searchParams.get('awb')

    if (!awb) {
      return Response.json(
        { success: false, error: 'awb query parameter is required' },
        { status: 400 }
      )
    }

    const status = await getAWBStatus(awb)

    return Response.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Track AWB error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}
