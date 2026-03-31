export async function POST() {
  return Response.json(
    { success: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': 'token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      },
    }
  )
}
