// utils/supabase/server.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // 1. await the cookie store
  const cookieStore = await cookies()

  // 2. hand Supabase the getAll/setAll hooks
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        // called by Supabase to read all cookies from the incoming request
        getAll: () => cookieStore.getAll(),
        // called by Supabase to set cookies on the response
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )
}
