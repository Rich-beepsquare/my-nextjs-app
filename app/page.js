'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ChatUI from '@/components/ChatUI'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)
    })()
  }, [])

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <button
          className="btn btn-primary"
          onClick={() => router.push('/login')}
        >
          Login
        </button>
        <button className="btn btn-link" onClick={() => router.push('/signup')}>
  Create an Account
</button>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Welcome, {user.email}</h1>
        <button
          className="btn btn-danger"
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
        >
          Sign Out
        </button>
      </div>

      <ChatUI />
    </div>
  )
}

