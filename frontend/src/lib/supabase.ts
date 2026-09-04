import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Admin auth will not work.')
}

// Falls back to a syntactically valid but unreachable project so createClient()
// never throws if env vars are missing; every real call will simply fail.
export const supabase: SupabaseClient = createClient(
  isConfigured ? supabaseUrl : 'https://unconfigured.supabase.co',
  isConfigured ? supabaseAnonKey : 'unconfigured',
  { auth: { persistSession: true, autoRefreshToken: true } }
)
