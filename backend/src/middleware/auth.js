import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw AppError.unauthorized('Missing Authorization bearer token.');

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw AppError.unauthorized('Invalid or expired session.');

  req.user = data.user;
  next();
});

export const attachProfile = asyncHandler(async (req, res, next) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, points')
    .eq('id', req.user.id)
    .single();

  if (error || !data) throw AppError.unauthorized('No profile found for this session.');

  req.profile = data;
  next();
});

export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') throw AppError.forbidden('Admin access required.');
  next();
}
