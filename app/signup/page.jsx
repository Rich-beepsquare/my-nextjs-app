'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(
        '🎉 Check your email for a confirmation link before logging in.'
      )
      // Optional: redirect you can do after a delay, e.g.:
      // setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card shadow-sm p-4"
        style={{ width: '100%', maxWidth: '360px' }}
      >
        <h2 className="card-title text-center mb-4">Sign Up</h2>

        {error && (
          <div className="alert alert-danger py-1" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="alert alert-success py-1" role="alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSignUp}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirm" className="form-label fw-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm"
              className="form-control"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100">
            Create Account
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            className="btn btn-link"
            onClick={() => router.push('/login')}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
