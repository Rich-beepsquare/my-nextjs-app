'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewAssistantPage() {
  const router = useRouter()

  // Form state
  const [name, setName]                   = useState('')
  const [visibility, setVisibility]       = useState('private')
  const [systemMessage, setSystemMessage] = useState('')
  const [orgId, setOrgId]                 = useState('')
  const [loading, setLoading]             = useState(true)

  // Load current user & orgId
  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }
      // Assume your orgId is stored as sub in user_metadata
      const meta = user.user_metadata || {}
      setOrgId(meta.sub || '')
      setLoading(false)
    })()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Grab the current user's access token for auth
    const {
      data: { session }
    } = await supabase.auth.getSession()

    const res = await fetch('/api/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        orgId,
        name,
        visibility,
        system_message: systemMessage
      })
    })

    if (res.ok) {
      router.push('/')
    } else {
      const err = await res.text()
      alert('Error creating assistant: ' + err)
    }
  }

  if (loading) {
    return (
      <div className="container py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4">Create New Assistant</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Assistant Name
          </label>
          <input
            type="text"
            id="name"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pricing Guide"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="visibility" className="form-label">
            Visibility
          </label>
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
          <label htmlFor="systemMessage" className="form-label">
            System Message
          </label>
          <textarea
            id="systemMessage"
            className="form-control"
            rows="4"
            value={systemMessage}
            onChange={(e) => setSystemMessage(e.target.value)}
            placeholder="Enter the system prompt that defines your assistant’s behavior..."
            required
          />
        </div>

        <button type="submit" className="btn btn-primary me-2">
          Create Assistant
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => router.push('/')}
        >
          Cancel
        </button>
      </form>
    </div>
  )
}
