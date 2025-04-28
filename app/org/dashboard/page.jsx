// app/org/dashboard/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../OrgProvider'

export default function OrgDashboard() {
  const orgId = useOrg()
  const [members, setMembers] = useState(null)

  // Invite form state
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState('member')
  const [inviteStatus, setInviteStatus] = useState(null)

  // Load members
  useEffect(() => {
    if (!orgId) return
    ;(async () => {
      const { data, error } = await supabase
        .from('org_members')
        .select('user_id, role, joined_at')
        .eq('org_id', orgId)
      if (error) console.error(error)
      else setMembers(data)
    })()
  }, [orgId])

  // Invite handler
  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteStatus('loading')

    try {
        const res  = await fetch('/api/org/invite', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ orgId, email: inviteEmail, role: inviteRole }) })
        const body = await res.json()
        if (!res.ok) {
        if (res.status === 404 && body.error === 'NO_USER') {
         setInviteStatus('no_user')
         return
        }
        if (res.status === 409 && body.error === 'ALREADY_MEMBER') {
        setInviteStatus('duplicate')
        return
        }
       setInviteStatus('error')
       return
        }
        setInviteStatus('sent')
      setInviteEmail('')

      // Reload members
      const { data, error } = await supabase
        .from('org_members')
        .select('user_id, role, joined_at')
        .eq('org_id', orgId)
      if (!error) setMembers(data)
    } catch (err) {
      console.error('Invite error:', err)
      setInviteStatus(
        err.message.includes('already a member')
          ? 'duplicate'
          : 'error'
      )
    }
  }

  return (
    <div className="container py-5">
      <h2>Organization Dashboard</h2>

      {/* Invite Member Form */}
      <form className="row g-2 align-items-end mb-4" onSubmit={handleInvite}>
        <div className="col-auto">
          <label className="form-label" htmlFor="inviteEmail">Email</label>
          <input
            id="inviteEmail"
            type="email"
            className="form-control"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label" htmlFor="inviteRole">Role</label>
          <select
            id="inviteRole"
            className="form-select"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="col-auto">
          <button
            type="submit"
            className="btn btn-success"
            disabled={inviteStatus === 'loading'}
          >
            {inviteStatus === 'loading' ? 'Inviting…' : 'Invite'}
          </button>
        </div>
        <div className="col-auto">
  {inviteStatus === 'sent'      && <span className="text-success">Invite sent!</span>}
  {inviteStatus === 'no_user'   && <span className="text-warning">No user found—ask them to sign up first.</span>}
  {inviteStatus === 'duplicate' && <span className="text-warning">User already a member.</span>}
  {inviteStatus === 'error'     && <span className="text-danger">Failed to invite.</span>}
</div>
      </form>

      {/* Members Table */}
      {!orgId && <p>Loading your organization…</p>}
      {orgId && members === null && <p>Loading members…</p>}
      {orgId && members && (
        <>
          <h4>Members ({members.length})</h4>
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Role</th>
                <th>Joined At</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id}>
                  <td>{m.user_id}</td>
                  <td>{m.role}</td>
                  <td>{new Date(m.joined_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
