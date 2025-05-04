'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../OrgProvider'

export default function OrgDashboard() {
  const router = useRouter()
  const ctx    = useOrg()

  // ─── H Y B R I D   O R G   C O N T E X T ─────────────────────────────

  // if `ctx` is a string, assume it's the old orgId
  // otherwise assume it's { org, loading, error }
  const isObject = typeof ctx === 'object' && ctx !== null
  const orgId     = isObject ? ctx.org?.id : ctx
  const loading   = isObject ? ctx.loading : false
  const error     = isObject ? ctx.error   : null

  // ─── S T A T E   &   R O U T E R ──────────────────────────────────────

  const [orgName, setOrgName]             = useState('')
  const [members, setMembers]             = useState([])
  const [userRole, setUserRole]           = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  // ─── 1) Fetch org name once we know orgId ──────────────────────────

  useEffect(() => {
    if (loading) return
    if (error) {
      console.error('Error loading org from context:', error)
      return
    }
    if (!orgId) return

    supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error loading org name:', error)
        else if (data?.name) setOrgName(data.name)
        else console.warn('No organization record for id', orgId)
      })
  }, [orgId, loading, error])

  // ─── 2) Fetch my role + all members ─────────────────────────────────

  useEffect(() => {
    if (!orgId) return

    ;(async () => {
      // a) who am I?
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser()
      if (userErr || !user) return router.push('/login')
      setCurrentUserId(user.id)

      // b) my org_members record
      const { data: me, error: meErr } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single()
      if (meErr) console.error('Error loading my role:', meErr)
      else setUserRole(me.role)

      // c) all org_members
      const { data: rows, error: membersErr } = await supabase
        .from('org_members')
        .select('user_id, role, joined_at')
        .eq('org_id', orgId)
      if (membersErr) {
        console.error('Error loading members:', membersErr)
        return
      }

      // d) batch-fetch profiles
      const userIds = rows.map((r) => r.user_id)
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)
      if (profilesErr) {
        console.error('Error loading profiles:', profilesErr)
        return
      }

      // e) merge for display
      const merged = rows.map((r) => {
        const p = profiles.find((p) => p.id === r.user_id)
        return {
          ...r,
          email: p?.email ?? '(no email)',
        }
      })

      setMembers(merged)
    })()
  }, [orgId, router])

  // ─── 3) Invite handler (admins only) ─────────────────────────────────

  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('member')
  const [inviteStatus, setInviteStatus] = useState('')

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

  // ─── 4) Render loading / error states ───────────────────────────────

  if (loading) return <p>Loading organization…</p>
  if (error)   return <p className="text-danger">Error: {error.message}</p>
  if (!orgId)  return <p>No organization found. Have you been invited?</p>

  // ─── 5) Render the dashboard ───────────────────────────────────────

  const iAmMember = userRole === 'member'
  const title     = iAmMember ? 'Organisation Admin(s)' : 'Members'
  const displayed = iAmMember
    ? members.filter((m) => m.role === 'admin' && m.user_id !== currentUserId)
    : members

  return (
    <div className="container py-5">
      <h2 className="mb-4">{orgName || 'Organisation'} Dashboard</h2>

      <h4>
        {title} <span className="badge bg-secondary">{displayed.length}</span>
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
          {displayed.map((m) => (
            <tr key={m.user_id}>
              <td>{m.email}</td>
              <td className="text-capitalize">{m.role}</td>
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
