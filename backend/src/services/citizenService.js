import { supabaseAdmin, supabasePublic } from '../lib/supabaseClient.js';
import { AppError } from '../utils/AppError.js';

async function findProfileByNic(nic) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, points')
    .eq('nic', nic)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findOrCreateCitizenByNic({ nic, email, fullName }) {
  const existing = await findProfileByNic(nic);
  if (existing) return existing;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: nic,
    email_confirm: true,
    user_metadata: { full_name: fullName || null, nic },
  });

  if (createError) {
    const retry = await findProfileByNic(nic);
    if (retry) return retry;
    throw createError;
  }

  return { id: created.user.id, points: 0 };
}

export async function awardPoints(citizenId, amount) {
  const { data, error } = await supabaseAdmin.rpc('increment_points', {
    p_citizen_id: citizenId,
    p_amount: amount,
  });

  if (error) throw error;
  return data;
}

export async function loginCitizenByNic(nic) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('nic', nic)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw AppError.notFound('No account found for this NIC. Report an issue first to create one.');
  }

  const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  if (getUserError || !authUser?.user?.email) {
    throw new AppError(500, 'Could not find an email on file for this NIC. Please contact support.');
  }

  const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
    email: authUser.user.email,
    password: nic,
  });

  if (signInError || !signInData?.session) {
    throw new AppError(500, 'Could not sign you in. Please try again.');
  }

  return signInData.session;
}
