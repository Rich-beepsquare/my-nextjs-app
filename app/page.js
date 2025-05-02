'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ChatUI from '@/components/ChatUI'

export default function HomePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail]         = useState('')
  const [assistants, setAssistants] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) return router.push('/login')

      const user = session.user
      setFirstName(user.user_metadata.first_name || user.email.split('@')[0])
      setEmail(user.email)

      const token = session.access_token
      const res = await fetch(`/api/assistants?orgId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setAssistants(json.assistants || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAssistantChange = e => {
    if (e.target.value === 'create_new') return router.push('/assistants/new')
    setSelectedId(e.target.value)
  }

  return (
    <div className="container py-5">
      <h1>Welcome, {firstName}</h1>
      <p className="text-muted small">Logged in as {email}</p>

      <div className="mb-4">
        <button className="btn btn-secondary me-2" onClick={() => router.push('/profile')}>
          Go to Profile
        </button>
        <button className="btn btn-outline-danger" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="assistantSelect" className="form-label">Choose an assistant</label>
        <select
          id="assistantSelect"
          className="form-select"
          value={selectedId}
          onChange={handleAssistantChange}
          disabled={loading}
        >
          <option value="">Default (ChatGPT)</option>
          {assistants.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
          {assistants.length > 0 && <option disabled>──────────</option>}
          <option value="create_new">➕ Create new assistant</option>
        </select>
      </div>

      {/* Pass assistantId (or null) into ChatUI */}
      <ChatUI assistantId={selectedId || null} />
    </div>
  )
}
