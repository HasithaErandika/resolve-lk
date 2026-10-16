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
    .select('id, role, council_id, province_id')
    .eq('id', req.user.id)
    .single();

  if (error || !data) throw AppError.unauthorized('No profile found for this session.');

  req.profile = data;
  next();
});

// Replaces the old requireAdmin - the role model now has three
// non-citizen roles (municipal_officer, provincial_officer, system_admin),
// each with different route access. See docs/srs/03-governance-and-roles.md.
export function requireRole(...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.profile?.role)) {
      throw AppError.forbidden('You do not have access to this resource.');
    }
    next();
  };
}
