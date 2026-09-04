import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY in the environment.');
}

// Trusted server-side client: verifies caller JWTs (auth.getUser), performs
// all civic_issues/profiles reads & writes, and auto-provisions citizen
// accounts (auth.admin.createUser). Bypasses Row Level Security by design —
// see docs/srs/04-architecture.md for why writes are centralized here.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Anon-key client, used ONLY to perform the NIC-based "My Reports" sign-in
// (auth.signInWithPassword) exactly as the frontend would — see lib/citizens.js.
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
