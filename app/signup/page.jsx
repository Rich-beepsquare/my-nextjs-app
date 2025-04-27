// app/signup/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [message, setMessage]     = useState(null)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const origin = window.location.origin
    // supabase-js v2: pass metadata in `options.data` and redirect
    const { error } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/login`,
          data: { first_name: firstName, last_name: lastName }
        }
      }
    )

    if (error) {
      setMessage({ type: 'danger', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: `Almost there! Check your inbox for a confirmation link.`
      })
    }

    setLoading(false)
  }

  return (
    <div className="container py-5" style={{ maxWidth: 400 }}>
      <h2>Create an Account</h2>

      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSignUp} className="mt-4">
        <div className="mb-3">
          <label htmlFor="firstName" className="form-label">First name</label>
          <input
            id="firstName"
            className="form-control"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="lastName" className="form-label">Last name</label>
          <input
            id="lastName"
            className="form-control"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
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

      <p className="mt-3 text-center">
        <button
          className="btn btn-link"
          onClick={() => router.push('/login')}
        >
          Already have an account? Sign in
        </button>
      </p>
    </div>
  )
}
