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
  const [errorMsg, setErrorMsg]   = useState('')
  const [step, setStep]           = useState<'form'|'check-email'>('form')

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 1) Sign up with Supabase Auth
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name:  lastName,
          }
        }
      })

    if (signUpError) {
      setErrorMsg(signUpError.message)
      setLoading(false)
      return
    }

    // 2) Insert into profiles table
    const user = signUpData.user
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id:         user.id,
          email:      user.email,
          first_name: firstName,
          last_name:  lastName,
        })

      if (profileError) {
        console.error('Profile insert error:', profileError)
        // we won’t block the user—just log it
      }
    }

    // 3) Move to “check your inbox” step
    setStep('check-email')
    setLoading(false)
  }

  // Render step 1: sign-up form
  if (step === 'form') {
    return (
      <div className="container py-5">
        <h1>Create an Account</h1>
        <form onSubmit={handleSignUp} className="mt-4">
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          <div className="mb-3">
            <label className="form-label">First Name</label>
            <input
              type="text"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-3">
          Already have an account?{' '}
          <a href="/login" className="link-primary">Sign in here</a>.
        </p>
      </div>
    )
  }

  // Render step 2: check your email
  return (
    <div className="container py-5">
      <h1>Almost there!</h1>
      <p>
        We’ve sent a confirmation link to <strong>{email}</strong>.<br/>
        Please check your inbox (and spam folder) to verify your address before signing in.
      </p>
      <button
        className="btn btn-outline-primary"
        onClick={() => router.push('/login')}
      >
        Go to Sign In
      </button>
    </div>
  )
}

