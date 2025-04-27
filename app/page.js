// app/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ChatUI from '@/components/ChatUI'    // make sure this path matches your file structure

export default function HomePage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="container text-center py-5">
        <h1>Welcome to the Home Page</h1>
        <button
          className="btn btn-primary"
          onClick={() => router.push('/login')}
        >
          Login
        </button>
      </div>
    )
  }

  const firstName = user.user_metadata.first_name || ''
  const lastName  = user.user_metadata.last_name  || ''
  const email     = user.email

  return (
    <div className="container py-5">
      {/* Greeting */}
      <h1>
        Welcome, {firstName} {lastName}!
      </h1>
      <p className="text-muted small">
        Logged in as {email}
      </p>

      <div className="my-4">
        <button
          className="btn btn-secondary me-2"
          onClick={() => router.push('/profile')}
        >
          Go to Profile
        </button>
        <button
          className="btn btn-outline-danger"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      {/* ====== Chat window goes here ====== */}
      <ChatUI />

    </div>
  )
}


  const firstName = user.user_metadata.first_name || ''
  const lastName  = user.user_metadata.last_name  || ''
  const email     = user.email

  return (
    <div className="container py-5">
      <h1>
        Welcome, {firstName} {lastName}!
      </h1>
      <p className="text-muted small">
        Logged in as {email}
      </p>

      <div className="mt-4">
        <button className="btn btn-secondary me-2" onClick={() => router.push('/profile')}>
          Go to Profile
        </button>
        <button className="btn btn-outline-danger" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      {/* … your ChatUI or other content goes here … */}
    </div>
  )
}
