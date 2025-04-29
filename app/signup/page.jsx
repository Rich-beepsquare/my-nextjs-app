// File: app/signup/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function SignUpPage() {
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [errors, setErrors]       = useState([])    // ✅ array, not number
  const [loading, setLoading]     = useState(false)
  const [message, setMessage]     = useState('')    // success / info

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // redirect back to your deployed domain when they click the confirmation link
        emailRedirectTo: `${window.location.origin}/login`
      }
    })

    if (error) {
      setErrors([ error.message ])
    } else {
      setMessage(
        '🎉 Check your inbox for a confirmation email, then come back and log in.'
      )
      // optionally clear the form:
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  return (
    <div className="container py-5">
      <h1>Create an Account</h1>

      <form onSubmit={handleSignUp} className="mb-4">
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            minLength={6}
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Sign Up'}
        </button>
      </form>

      {/* display any errors */}
      {errors.length > 0 && (
        <div className="alert alert-danger">
          {errors.map((err, i) => <div key={i}>{err}</div>)}
        </div>
      )}

      {/* display success/info */}
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {/* link back to login */}
      <p>
        Already have an account?{' '}
        <button
          className="btn btn-link p-0"
          onClick={() => router.push('/login')}
        >
          Log in here
        </button>.
      </p>
    </div>
  )
}

