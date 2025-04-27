'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/') // back to home with chat
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '360px' }}>
        <h2 className="card-title text-center mb-4">Sign In</h2>

        {error && (
          <div className="alert alert-danger py-1" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
              required
            />
          </div>

          <div className="mb-4">
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
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Sign In
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center mt-2">
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => router.push('/forgot-password')}
          >
            Forgot your password?
          </button>
        </div>

        {/* Create Account Link */}
        <div className="text-center mt-3">
          <button
            className="btn btn-link"
            onClick={() => router.push('/signup')}
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  )
}
