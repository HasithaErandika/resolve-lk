import { supabaseAdmin } from '../lib/supabaseClient.js';

async function findProfileByNic(nic) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, contact_email')
    .eq('nic', nic)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Citizens never have a password - see docs/srs/03-governance-and-roles.md
// #citizen-identity-what-stays-frictionless-and-what-changed. Access to
// their own history is exclusively via NIC + OTP (services/otpService.js),
// which requires a real email on the auth.users row to deliver a code to.
export async function findOrCreateCitizenByNic({ nic, contactEmail, contactPhone, fullName }) {
  const existing = await findProfileByNic(nic);
  if (existing) return existing;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: contactEmail,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || null,
      nic,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      role: 'citizen',
    },
  });

  if (createError) {
    // Another concurrent submission with the same NIC may have won the race.
    const retry = await findProfileByNic(nic);
    if (retry) return retry;
    throw createError;
  }

  return { id: created.user.id, contact_email: contactEmail };
}
