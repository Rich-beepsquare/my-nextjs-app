// app/signup/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // build a redirect URL to your login page on the current origin
    const redirectTo = `${window.location.origin}/login`

    const { error } = await supabase.auth.signUp(
      { email, password },
      { redirectTo }
    )

    if (error) {
      setMessage({ type: 'danger', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: `Check your email for a confirmation link—we'll redirect you to login once confirmed.`,
      })
    }

    setLoading(false)
  }

  return (
    <div className="container py-5">
      <h1>Create an Account</h1>

      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSignUp} className="mt-4" style={{ maxWidth: 400 }}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            type="email"
            id="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>

      <div className="mt-3">
        <button
          className="btn btn-link"
          onClick={() => router.push('/login')}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  )
}
