'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // supabase-js will parse the URL fragment and set session on recovery link click
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session?.access_token) {
        setReady(true)
      } else {
        setError('Invalid or expired reset link.')
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setMessage('✅ Password updated! Redirecting to login…')
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div>Loading…</div>
      </div>
    )
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '360px' }}>
        <h2 className="card-title text-center mb-4">Choose a New Password</h2>

        {message && <div className="alert alert-success py-1">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-semibold">
              New Password
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

          <button type="submit" className="btn btn-success w-100">
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
