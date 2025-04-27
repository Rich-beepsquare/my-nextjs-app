import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qsueohibalohyghvlylg.supabase.co'; // Supabase project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdWVvaGliYWxvaHlnaHZseWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDM3MzUsImV4cCI6MjA2MDk3OTczNX0.jkkgm7MScL8zRv0XJV8dmP3t5Sa5nw06AwHOKlaR4cc'; // Your Supabase public anon key

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);