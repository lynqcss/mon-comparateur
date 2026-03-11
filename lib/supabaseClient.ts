import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use the Service Role Key for backend administrative tasks. This bypasses RLS.
// IMPORTANT: Never expose NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to the client-side.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
