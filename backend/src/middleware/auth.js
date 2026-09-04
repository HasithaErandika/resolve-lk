import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Verifies the bearer token against Supabase Auth and attaches the user to req.user.
 * 401s if the token is missing or invalid.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization bearer token.' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  req.user = data.user;
  next();
}

/**
 * Must run after requireAuth. 403s unless the caller's profile role is 'admin'.
 * Role is never trusted from the client — it is looked up server-side.
 */
export async function requireAdmin(req, res, next) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || data?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  next();
}
