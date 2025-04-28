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
    // 1) Lookup via Admin REST
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

    // If Supabase itself returns 404 or other, bubble that
    if (!adminRes.ok) {
      if (adminRes.status === 404) {
        return NextResponse.json({ error: 'NO_USER' }, { status: 404 })
      }
      throw new Error(`Admin lookup error (${adminRes.status})`)
    }

    // **Always** parse as array
    const users = await adminRes.json()
    const user  = Array.isArray(users) ? users[0] : null

    if (!user) {
      return NextResponse.json({ error: 'NO_USER' }, { status: 404 })
    }

    // 2) Try to insert membership
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
    return NextResponse.json(
      { error: err.message || 'SERVER' },
      { status: err.message.startsWith('Admin lookup') ? 500 : 500 }
    )
  }
}

