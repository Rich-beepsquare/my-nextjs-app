// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qsueohibalohyghvlylg.supabase.co'; // Supabase project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdWVvaGliYWxvaHlnaHZseWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDM3MzUsImV4cCI6MjA2MDk3OTczNX0.jkkgm7MScL8zRv0XJV8dmP3t5Sa5nw06AwHOKlaR4cc'; // Your Supabase public anon key

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      // Persist session to localStorage so reloads/refreshes keep you signed in
      persistSession: true,
      // Automatically refresh the access token when it’s about to expire
      autoRefreshToken: true,
      // Explicitly tell Supabase to use localStorage (the default)
      storage: typeof window === 'undefined' ? undefined : window.localStorage,
    }
  }
);
