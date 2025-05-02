'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewAssistantPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [systemMessage, setSystemMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1) get the current session (to extract the JWT)
    const {
      data: { session },
      error: sessionErr
    } = await supabase.auth.getSession()
    if (sessionErr || !session) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    const token = session.access_token

    // 2) derive orgId (from your user_metadata.sub)
    const user = session.user
    const orgId = user.user_metadata.sub
    if (!orgId) {
      setError('orgId not found in user metadata')
      setLoading(false)
      return
    }

    // 3) call your API with the Bearer token
    const res = await fetch('/api/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orgId,
        name,
        visibility,
        system_message: systemMessage
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unknown error')
      setLoading(false)
      return
    }

    // 4) on success, go home (or wherever)
    router.push('/')
  }

  return (
    <div className="container py-5">
      <h1>Create New Assistant</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            id="name"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="visibility" className="form-label">Visibility</label>
          <select
            id="visibility"
            className="form-select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="systemMessage" className="form-label">System Message</label>
          <textarea
            id="systemMessage"
            className="form-control"
            rows={4}
            value={systemMessage}
            onChange={(e) => setSystemMessage(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create Assistant'}
        </button>
      </form>
    </div>
  )
}
