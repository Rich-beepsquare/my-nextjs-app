'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const router = useRouter()

  const handleReset = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      // redirect into our new reset form
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(
        '🔔 If that email is in our system, you’ll receive a reset link shortly.'
      )
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '360px' }}>
        <h2 className="card-title text-center mb-4">Reset Password</h2>

        {error && <div className="alert alert-danger py-1">{error}</div>}
        {message && <div className="alert alert-success py-1">{message}</div>}

        <form onSubmit={handleReset}>
          <div className="mb-4">
            <label htmlFor="email" className="form-label fw-semibold">
              Your Email
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

          <button type="submit" className="btn btn-warning w-100">
            Send Reset Link
          </button>
        </form>

        <div className="text-center mt-3">
          <button className="btn btn-link" onClick={() => router.push('/login')}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
