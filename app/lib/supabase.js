// lib/supabase.js
'use client'  // mark as client-side so NEXT_PUBLIC_* vars are available

import { createClient } from '@supabase/supabase-js'

const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,       // keep you signed in across reloads
    autoRefreshToken: true,     // automatically renew tokens
    storage:
      typeof window === 'undefined'
        ? undefined
        : window.localStorage,  // only in the browser
  },
})
