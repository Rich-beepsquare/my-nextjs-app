'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../OrgProvider'

export default function OrgDashboard() {
  const router = useRouter()
  const orgId   = useOrg()

  const [orgName, setOrgName]   = useState('')
  const [members, setMembers]   = useState([])
  const [userRole, setUserRole] = useState(null)

  // Fetch organization name
  useEffect(() => {
    if (!orgId) return
    ;(async () => {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .maybeSingle()
      if (error) {
        console.error('❌ Error fetching org name:', error.message || error)
        return
      }
      if (org) setOrgName(org.name)
    })()
  }, [orgId])

  // Load my role & members, then profiles
  useEffect(() => {
    if (!orgId) return

    ;(async () => {
      // 1️⃣ Ensure user is signed in
      const {
        data: { user },
        error: sessionErr,
      } = await supabase.auth.getUser()
      if (sessionErr || !user) {
        console.error('🚨 Not logged in', sessionErr)
        router.push('/login')
        return
      }

      // 2️⃣ Fetch my role
      const { data: me, error: meErr } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single()
      if (meErr) {
        console.error('❌ Error fetching my role:', meErr.message || meErr)
      } else {
        setUserRole(me.role)
      }

      // 3️⃣ Fetch org_members rows
      const { data: rows, error: membersErr } = await supabase
        .from('org_members')
        .select('user_id, role, joined_at')
        .eq('org_id', orgId)
      if (membersErr) {
        console.error('❌ Error fetching members:', membersErr.message || membersErr)
        return
      }

      console.log('🟢 org_members rows:', rows)

      // 4️⃣ Fetch matching profiles
      const userIds = rows.map((r) => r.user_id)
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)
      if (profilesErr) {
        console.error('❌ Error fetching profiles:', profilesErr.message || profilesErr)
        return
      }

      console.log('🟢 profiles rows:', profiles)

      // 5️⃣ Merge them
      const merged = rows.map((r) => {
        const p = profiles.find((p) => p.id === r.user_id)
        return {
          ...r,
          email: p?.email || '(no email)',
        }
      })

      console.log('🟢 merged result:', merged)
      setMembers(merged)
    })()
  }, [orgId, router])

  return (
    <div className="container py-5">
      <h2>{orgName || 'Organization'} Dashboard</h2>

      <h4>Members ({members.length})</h4>
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Joined At</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.user_id}>
              <td>{m.email}</td>
              <td>{m.role}</td>
              <td>{new Date(m.joined_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
