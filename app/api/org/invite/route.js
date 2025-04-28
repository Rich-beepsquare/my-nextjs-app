// app/api/org/invite/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { orgId, email, role } = await request.json()

  try {
    // 1) Admin-REST lookup
    const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, '')
    const adminRes = await fetch(
      `${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey:        process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      }
    )
    if (!adminRes.ok) {
      // If Supabase itself says 404, treat as no user
      if (adminRes.status === 404) {
        return NextResponse.json({ error: 'NO_USER' }, { status: 404 })
      }
      throw new Error(`Admin lookup failed (${adminRes.status})`)
    }

    // 2) Parse JSON, then normalize to an array of user‐records
    const raw = await adminRes.json()
    // Supabase might return an array directly, or { users: [...] }, or { data: [...] }
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.users)
        ? raw.users
        : Array.isArray(raw.data)
          ? raw.data
          : []
    const user = list[0] || null

    if (!user) {
      return NextResponse.json({ error: 'NO_USER' }, { status: 404 })
    }

    // 3) Insert into org_members
    const { error: insertErr } = await supabase
      .from('org_members')
      .insert([{ org_id: orgId, user_id: user.id, role }])

    if (insertErr) {
      // duplicate key → already a member
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'ALREADY_MEMBER' },
          { status: 409 }
        )
      }
      throw insertErr
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Invite API error:', err)
    const code = err.message.startsWith('Admin lookup failed')
      ? 500
      : 500
    return NextResponse.json(
      { error: 'SERVER' },
      { status: code }
    )
  }
}

