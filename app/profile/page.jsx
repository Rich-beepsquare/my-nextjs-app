'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/login')
        } else {
          setUser(currentUser)
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load profile.')
      }
    })()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  if (!user) {
    return null // or a spinner
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '360px' }}>
        <h2 className="card-title text-center mb-4">Your Profile</h2>

        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <div className="form-control-plaintext">{user.email}</div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Joined</label>
          <div className="form-control-plaintext">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="d-grid gap-2">
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            Go to Home
          </button>
          <button className="btn btn-danger" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
