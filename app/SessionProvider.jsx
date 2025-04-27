'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SessionProvider({ children }) {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Redirect to login if the session is null (user is logged out)
        router.push('/login')
      }
    })

    // Cleanup the listener
    return () => {
      // Ensure cleanup is done correctly
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe()
      }
    }
  }, [router])

  return <>{children}</>
}


