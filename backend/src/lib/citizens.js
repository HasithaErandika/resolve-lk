import { supabaseAdmin, supabasePublic } from './supabase.js';

/**
 * Looks up a citizen profile by NIC; auto-provisions one on first report.
 * This is what lets a citizen submit a report with no prior signup — the
 * report form IS the signup form.
 *
 * Supabase Auth requires a real email as the account's username, so the
 * report form collects one — but NIC (not email) is the durable identity:
 * find-or-create is always keyed on NIC. A repeat NIC reuses its existing
 * account even if a different email is typed on a later report.
 */
export async function findOrCreateCitizenByNic({ nic, email, fullName }) {
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id, points')
    .eq('nic', nic)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: nic,
    email_confirm: true,
    user_metadata: { full_name: fullName || null, nic },
  });

  if (createError) {
    // Likely a race: two reports with the same new NIC submitted at once.
    // The profiles.nic unique constraint means only one create wins —
    // fall back to reading the row the other request just created.
    const { data: retry } = await supabaseAdmin
      .from('profiles')
      .select('id, points')
      .eq('nic', nic)
      .maybeSingle();
    if (retry) return retry;
    throw createError;
  }

  return { id: created.user.id, points: 0 };
}

/** Adds `amount` contribution points to a citizen's profile, returns the new total. */
export async function awardPoints(citizenId, amount) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('points')
    .eq('id', citizenId)
    .single();

  const newTotal = (profile?.points || 0) + amount;

  await supabaseAdmin.from('profiles').update({ points: newTotal }).eq('id', citizenId);

  return newTotal;
}

/**
 * "My Reports" sign-in: a citizen types only their NIC. The backend looks up
 * the email tied to that NIC's account, then signs in with (email, NIC) —
 * password has always been the NIC — and returns a real Supabase session for
 * the frontend to adopt with supabase.auth.setSession(). No password field is
 * ever shown to the citizen.
 */
export async function loginCitizenByNic(nic) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('nic', nic)
    .maybeSingle();

  if (!profile) {
    return { error: 'No account found for this NIC. Report an issue first to create one.' };
  }

  const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  if (getUserError || !authUser?.user?.email) {
    return { error: 'Could not find an email on file for this NIC. Please contact support.' };
  }

  const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
    email: authUser.user.email,
    password: nic,
  });

  if (signInError || !signInData?.session) {
    return { error: 'Could not sign you in. Please try again.' };
  }

  return { session: signInData.session };
}
