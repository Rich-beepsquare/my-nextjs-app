// app/api/assistants/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** 
 * supabaseAdmin bypasses RLS (for org-stub + assistants insert)
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/** 
 * supabaseUser is only used to verify the JWT & pull user.id 
 * (it still honors RLS, but we only read from auth.users here)
 */
function getSupabaseUserClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  )
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing orgId query parameter' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('assistants')
    .select('*')
    .eq('org_id', orgId)

  if (error) {
    console.error('assistants fetch error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assistants: data })
}

export async function POST(request) {
  // 1) parse & validate the Bearer token
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/, '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2) look up the user
  const supabaseUser = getSupabaseUserClient(token)
  const {
    data: { user },
    error: userErr
  } = await supabaseUser.auth.getUser()
  if (userErr || !user) {
    console.error('auth lookup error', userErr)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const creatorId = user.id

  // 3) pull body
  const { orgId, name, visibility, system_message } = await request.json()
  if (!orgId || !name || !visibility || !system_message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // 4) ensure org exists (service role bypasses RLS)
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 50)

    const { error: createOrgErr } = await supabaseAdmin
      .from('organizations')
      .insert([{ id: orgId, name: slug, slug }])

    if (createOrgErr) {
      console.error('organization insert error', createOrgErr)
      return NextResponse.json(
        { error: createOrgErr.message },
        { status: 500 }
      )
    }
  }

  // 5) insert assistant with creator_id
  const { error: insertErr } = await supabaseAdmin
    .from('assistants')
    .insert([
      {
        org_id: orgId,
        name,
        visibility,
        system_message,
        creator_id: creatorId
      }
    ])

  if (insertErr) {
    console.error('assistants insert error', insertErr)
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
