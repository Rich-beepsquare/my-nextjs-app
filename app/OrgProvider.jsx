// app/OrgProvider.jsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const OrgContext = createContext(null)

export function OrgProvider({ children }) {
  const [orgId, setOrgId] = useState(null)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser()

      if (userErr || !user) return console.error('No user session', userErr)

      const { data: memberships, error: mErr } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)

      if (mErr) return console.error('Org lookup error', mErr)
      setOrgId(memberships?.[0]?.org_id || null)
    })()
  }, [])

  return (
    <OrgContext.Provider value={orgId}>
      {children}
    </OrgContext.Provider>
  )
}

export const useOrg = () => useContext(OrgContext)

