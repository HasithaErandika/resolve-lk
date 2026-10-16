import { supabaseAdmin, supabasePublic } from '../lib/supabaseClient.js';
import { AppError } from '../utils/AppError.js';

// NIC + one-time code (OTP) is the only way a citizen accesses their own
// report history - there is no password anywhere in the citizen flow. See
// docs/srs/03-governance-and-roles.md#citizen-identity-what-stays-frictionless-and-what-changed
// and docs/srs/05-architecture.md for the full sequence.
//
// Implementation note: this rides on Supabase Auth's own passwordless email
// OTP (signInWithOtp / verifyOtp) rather than a hand-rolled otp_codes table
// - Supabase already generates, stores, expires, and rate-limits the code,
// and already sends the email, so there's no new table and no new vendor.
// See PLAN.md's "Key implementation decision: OTP delivery" note.

async function findProfileByNic(nic) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, contact_email')
    .eq('nic', nic)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function requestOtp(nic) {
  const profile = await findProfileByNic(nic);

  // Deliberately the same outcome whether or not this NIC is registered - // avoids leaking which NICs exist in the system. See
  // docs/srs/07-api-specification.md#post-apimy-reportsotprequest.
  if (!profile?.contact_email) return;

  const { error } = await supabasePublic.auth.signInWithOtp({
    email: profile.contact_email,
    options: { shouldCreateUser: false },
  });

  if (error) throw error;
}

export async function verifyOtp(nic, code) {
  const profile = await findProfileByNic(nic);
  if (!profile?.contact_email) {
    throw AppError.badRequest({ code: 'That code is invalid or has expired. Request a new one.' });
  }

  const { data, error } = await supabasePublic.auth.verifyOtp({
    email: profile.contact_email,
    token: code,
    type: 'email',
  });

  if (error || !data?.session) {
    throw AppError.badRequest({ code: 'That code is invalid or has expired. Request a new one.' });
  }

  return data.session;
}
