import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase.js';
import { uploadIssuePhoto } from '../lib/r2.js';
import { triageIssue } from '../lib/gemini.js';
import { findOrCreateCitizenByNic, awardPoints } from '../lib/citizens.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateNewIssue, validateStatus } from '../validation/issues.js';

const POINTS_PER_REPORT = 10;
const POINTS_BONUS_ON_RESOLVE = 15;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Photo must be an image file.'));
    }
    cb(null, true);
  },
});

export const issuesRouter = Router();

// POST /api/issues — PUBLIC. No login wall.
// The NIC field doubles as citizen identity: first-time NIC auto-provisions
// an account (using the submitted email as the Supabase Auth username and
// the NIC itself as the password); a returning NIC reuses its existing
// account regardless of the email typed this time. See docs/srs/02-solution-overview.md.
issuesRouter.post('/', upload.single('photo'), async (req, res) => {
  const errors = validateNewIssue(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const { nic, email, full_name, category, ward, landmark, description } = req.body;

  try {
    const citizen = await findOrCreateCitizenByNic({ nic: nic.trim(), email: email.trim(), fullName: full_name });

    let photo_url = null;
    if (req.file) {
      photo_url = await uploadIssuePhoto(req.file);
    }

    const triage = await triageIssue({ category, description });

    const { data, error } = await supabaseAdmin
      .from('civic_issues')
      .insert({
        citizen_id: citizen.id,
        category,
        ward,
        landmark,
        description,
        photo_url,
        ai_priority: triage.priority,
        ai_department: triage.department,
        ai_reason: triage.reason,
      })
      .select()
      .single();

    if (error) throw error;

    const contributor_points = await awardPoints(citizen.id, POINTS_PER_REPORT);

    res.status(201).json({ ...data, contributor_points });
  } catch (error) {
    console.error('Failed to create issue:', error);
    res.status(500).json({ error: 'Something went wrong while submitting your report. Please try again.' });
  }
});

// GET /api/issues/public — PUBLIC. Anonymous, browsable feed for the landing
// page ("gig board" of open issues). Never exposes citizen_id.
issuesRouter.get('/public', async (req, res) => {
  const { category, status, search } = req.query;

  let query = supabaseAdmin
    .from('civic_issues')
    .select('id, category, ward, landmark, description, photo_url, status, ai_priority, ai_department, ai_reason, created_at')
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`description.ilike.%${search}%,landmark.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list public issues:', error);
    return res.status(500).json({ error: 'Could not load issues right now.' });
  }

  res.json(data);
});

// GET /api/issues — "My Reports" (citizen, own issues only) or admin (all issues).
// Requires a session — for a citizen, the frontend obtains one by signing in
// with their NIC via Supabase Auth directly (NIC doubles as the password).
issuesRouter.get('/', requireAuth, async (req, res) => {
  const { category, status, search } = req.query;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  let query = supabaseAdmin.from('civic_issues').select('*').order('created_at', { ascending: false });

  if (profile?.role !== 'admin') {
    query = query.eq('citizen_id', req.user.id);
  }
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`description.ilike.%${search}%,landmark.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list issues:', error);
    return res.status(500).json({ error: 'Could not load issues right now.' });
  }

  res.json(data);
});

// GET /api/issues/:id — citizens may only fetch their own; admins may fetch any.
issuesRouter.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (profile?.role !== 'admin' && data.citizen_id !== req.user.id) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  res.json(data);
});

// PATCH /api/issues/:id/status — admin-only status update. Resolving an
// issue awards the reporting citizen a contribution-points bonus.
issuesRouter.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const statusError = validateStatus(req.body.status);
  if (statusError) {
    return res.status(400).json({ errors: { status: statusError } });
  }

  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .update({ status: req.body.status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  if (req.body.status === 'Resolved') {
    await awardPoints(data.citizen_id, POINTS_BONUS_ON_RESOLVE);
  }

  res.json(data);
});
