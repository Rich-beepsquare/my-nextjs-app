// app/api/assistants/route.js
import { NextResponse }      from 'next/server'
import { supabaseServer }    from '@/lib/supabase-server'

export const runtime = 'nodejs'

// GET /api/assistants?orgId=…
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from('assistants')
    .select('id, name, visibility, created_by, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/assistants error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/assistants
// body: { orgId, name, visibility, system_message }
export async function POST(request) {
  const body = await request.json()
  const { orgId, name, visibility, system_message } = body

  if (!orgId || !name || !visibility || !system_message) {
    return NextResponse.json(
      { error: 'orgId, name, visibility & system_message are all required' },
      { status: 400 }
    )
  }

  // pull the user ID from the Supabase JWT
  // (Next.js passes the user’s token via the Authorization header automatically)
  const userRes = await supabaseServer.auth.getUser()
  const user = userRes.data.user
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabaseServer
    .from('assistants')
    .insert([
      {
        org_id:         orgId,
        name,
        visibility,
        system_message,
        created_by:    user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('POST /api/assistants error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
