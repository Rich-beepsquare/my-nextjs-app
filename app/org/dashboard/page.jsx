// File: app/org/dashboard/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { supabase }            from '../../lib/supabase'
import { useOrg }              from '../../OrgProvider'

export default function OrgDashboard() {
  const router   = useRouter()
  const orgId    = useOrg()

  const [orgName, setOrgName]           = useState('')
  const [members, setMembers]           = useState([])
  const [userRole, setUserRole]         = useState(null)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('member')
  const [inviteStatus, setInviteStatus] = useState('')

  // 1) Fetch org name
  useEffect(() => {
    if (!orgId) return
    supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading org name:', error)
          } else if (data && data.name) {
          setOrgName(data.name)
          } else {
          console.warn('No organization record for id', orgId)
           }
      })
  }, [orgId])

  // 2) Fetch my role & all members + their emails
  useEffect(() => {
    if (!orgId) return

    ;(async () => {
      // a) ensure logged in
      const { data: sessionData } = await supabase.auth.getUser()
      const user = sessionData.user
      if (!user) return router.push('/login')

      // b) get my role
      const { data: me, error: meErr } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single()
      if (meErr) console.error(meErr)
      else setUserRole(me.role)

      // c) get all members
      const { data: rows, error: membersErr } = await supabase
        .from('org_members')
        .select('user_id, role, joined_at')
        .eq('org_id', orgId)
      if (membersErr) {
        console.error(membersErr)
        return
      }

      // d) fetch their emails from profiles
      const userIds = rows.map((r) => r.user_id)
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)
      if (profilesErr) {
        console.error(profilesErr)
        return
      }

      // merge for display
      const merged = rows.map((r) => {
        const p = profiles.find((p) => p.id === r.user_id)
        return { ...r, email: p?.email || '(no email)' }
      })
      setMembers(merged)
    })()
  }, [orgId, router])

  // 3) Invite handler (admins only)
  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteStatus('')
    try {
      const res = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, email: inviteEmail, role: inviteRole }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text)
      setInviteStatus('Invitation sent!')
      setInviteEmail('')
    } catch (err) {
      setInviteStatus(`Error: ${err.message || 'Failed to invite'}`)
    }
  }

  return (
    <div className="container py-5">
      <h2>{orgName || 'Organization'} Dashboard</h2>

      <h4 className="mt-4">
        Members <span className="badge bg-secondary">{members.length}</span>
      </h4>

      <table className="table mt-2">
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

      {userRole === 'admin' && (
        <div className="mt-5">
          <h5>Invite New Member</h5>
          <form className="row g-2 align-items-center" onSubmit={handleInvite}>
            <div className="col-auto">
              <input
                type="email"
                className="form-control"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="col-auto">
              <select
                className="form-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-primary">
                Invite
              </button>
            </div>
          </form>
          {inviteStatus && (
            <div className="mt-2">
              <small className="text-muted">{inviteStatus}</small>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
