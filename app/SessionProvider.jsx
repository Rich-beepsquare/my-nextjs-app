// app/SessionProvider.jsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SessionContext = createContext({ session: null, user: null })

export default function SessionProvider({ children }) {
  const [session, setSession] = useState(null)
  const router = useRouter()

  // on mount, grab the initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // subscribe to changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (!session) router.push('/login')
      }
    )
    return () => listener.subscription.unsubscribe()
  }, [router])

  return (
    <SessionContext.Provider value={{ session, user: session?.user }}>
      {children}
    </SessionContext.Provider>
  )
}

// the hook your pages call
export function useSession() {
  const ctx = useContext(SessionContext)
  if (ctx === undefined) {
    throw new Error('useSession must be used inside <SessionProvider>')
  }
  return ctx
}
