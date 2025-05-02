'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'
import ChatUI from '@/components/ChatUI'

export default function HomePage() {
  const router = useRouter()

  // user info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')

  // assistants
  const [assistants, setAssistants] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    ;(async () => {
      // 1) load user session
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser()
      if (userErr || !user) {
        router.push('/login')
        return
      }

      // pull out names/email
      const meta = user.user_metadata || {}
      const fn   = meta.first_name || ''
      const ln   = meta.last_name  || ''
      const em   = user.email || ''
      if (fn) {
        setFirstName(fn)
        setLastName(ln)
      } else if (em) {
        // fallback: use beginning of email
        setFirstName(em.split('@')[0])
      }
      setEmail(em)

      // 2) load assistants for this org
      const orgId = meta.sub        // or however you store it
      const res   = await fetch(`/api/assistants?orgId=${orgId}`)
      if (res.ok) {
        const { assistants } = await res.json()
        setAssistants(Array.isArray(assistants) ? assistants : [])
      }
      setLoading(false)
    })()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAssistantChange = (e) => {
    const val = e.target.value
    if (val === 'create_new') {
      router.push('/assistants/new')
      return
    }
    setSelectedId(val)
  }

  return (
    <div className="container py-5">
      <h1>Welcome, {firstName}</h1>
      <p className="text-muted small">Logged in as {email}</p>

      <div className="mb-4">
        <button
          className="btn btn-secondary me-2"
          onClick={() => router.push('/profile')}
        >
          Go to Profile
        </button>
        <button
          className="btn btn-outline-danger"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      {/* Assistant Selector: always show */}
      <div className="mb-4">
        <label htmlFor="assistantSelect" className="form-label">
          Choose an assistant
        </label>
        <select
          id="assistantSelect"
          className="form-select"
          value={selectedId}
          onChange={handleAssistantChange}
          disabled={loading}
        >
          <option value="">
            Default (ChatGPT)
          </option>
          {assistants.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          {assistants.length > 0 && (
            <option disabled>──────────</option>
          )}
          <option value="create_new">
            ➕ Create new assistant
          </option>
        </select>
      </div>

      {/* Chat UI: pass null for default */}
      <ChatUI assistantId={selectedId || null} />
    </div>
  )
}
