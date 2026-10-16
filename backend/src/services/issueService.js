import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { getCouncilIdsForProvince } from './councilService.js';

const PUBLIC_COLUMNS =
  'id, council_id, category, ward, landmark, description, photo_url, latitude, longitude, status, ' +
  'ai_priority, ai_jurisdiction, ai_redirect_authority, ai_department, ai_reason, ' +
  'sla_ack_due_at, sla_resolve_due_at, escalated, reopened_count, created_at, updated_at';
const FULL_COLUMNS = `${PUBLIC_COLUMNS}, citizen_id`;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Who may move an issue from which status to which, and which role is
// allowed to make that specific move. See
// docs/srs/03-governance-and-roles.md#status-pipeline.
const ALLOWED_TRANSITIONS = {
  Submitted: { Acknowledged: 'municipal_officer' },
  Acknowledged: { 'In Progress': 'municipal_officer' },
  'In Progress': { Resolved: 'municipal_officer' },
  Resolved: { Verified: 'citizen', Reopened: 'citizen' },
  Reopened: { 'In Progress': 'municipal_officer' },
};
const REOPEN_ESCALATION_THRESHOLD = 2;

function toRange(query) {
  const pageSize = Math.min(Math.max(Number(query.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number(query.page) || 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to, page, pageSize };
}

function applyFilters(query, { category, status, search, council_id: councilId }) {
  let result = query;
  if (category) result = result.eq('category', category);
  if (status) result = result.eq('status', status);
  if (councilId) result = result.eq('council_id', councilId);
  if (search) result = result.or(`description.ilike.%${search}%,landmark.ilike.%${search}%`);
  return result;
}

export async function createIssue({ citizenId, councilId, category, ward, landmark, description, photoUrl, latitude, longitude, triage, sla }) {
  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .insert({
      citizen_id: citizenId,
      council_id: councilId,
      category,
      ward,
      landmark,
      description,
      photo_url: photoUrl,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: 'Submitted',
      ai_priority: triage.priority,
      ai_jurisdiction: triage.jurisdiction,
      ai_redirect_authority: triage.redirectAuthority,
      ai_department: triage.department,
      ai_reason: triage.reason,
      sla_ack_due_at: sla.slaAckDueAt,
      sla_resolve_due_at: sla.slaResolveDueAt,
    })
    .select(FULL_COLUMNS)
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from('issue_status_history')
    .insert({ issue_id: data.id, from_status: null, to_status: 'Submitted', changed_by: citizenId });

  return data;
}

export async function listPublicIssues(filters) {
  const { from, to, page, pageSize } = toRange(filters);

  let query = supabaseAdmin
    .from('civic_issues')
    .select(PUBLIC_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  query = applyFilters(query, filters);

  const { data, error, count } = await query;
  if (error) throw error;

  return { issues: data, page, pageSize, total: count ?? data.length };
}

// Scopes the query by the caller's role - citizen sees only their own
// reports, a Municipal Officer only their own council's, a Provincial
// Officer every council in their own province. See
// docs/srs/05-architecture.md for why this scoping lives here (one place
// doing DB filtering) rather than in separate middleware.
async function scopeToViewer(query, profile) {
  if (profile.role === 'citizen') {
    return query.eq('citizen_id', profile.id);
  }
  if (profile.role === 'municipal_officer') {
    return query.eq('council_id', profile.council_id);
  }
  if (profile.role === 'provincial_officer') {
    const councilIds = await getCouncilIdsForProvince(profile.province_id);
    return query.in('council_id', councilIds.length > 0 ? councilIds : ['00000000-0000-0000-0000-000000000000']);
  }
  throw AppError.forbidden('This role cannot list issues.');
}

export async function listIssuesForViewer(profile, filters) {
  const { from, to, page, pageSize } = toRange(filters);

  let query = supabaseAdmin
    .from('civic_issues')
    .select(FULL_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  query = await scopeToViewer(query, profile);
  query = applyFilters(query, filters);

  const { data, error, count } = await query;
  if (error) throw error;

  return { issues: data, page, pageSize, total: count ?? data.length };
}

export async function getIssueForViewer(profile, issueId) {
  const { data, error } = await supabaseAdmin.from('civic_issues').select(FULL_COLUMNS).eq('id', issueId).maybeSingle();

  if (error) throw error;
  if (!data) throw AppError.notFound('Issue not found.');

  const inScope =
    (profile.role === 'citizen' && data.citizen_id === profile.id) ||
    (profile.role === 'municipal_officer' && data.council_id === profile.council_id) ||
    (profile.role === 'provincial_officer' &&
      (await getCouncilIdsForProvince(profile.province_id)).includes(data.council_id));

  if (!inScope) throw AppError.notFound('Issue not found.');
  return data;
}

export async function updateIssueStatus(profile, issueId, status, note) {
  const { data: issue, error: fetchError } = await supabaseAdmin
    .from('civic_issues')
    .select('id, status, council_id, citizen_id, reopened_count')
    .eq('id', issueId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!issue) throw AppError.notFound('Issue not found.');

  const requiredRole = ALLOWED_TRANSITIONS[issue.status]?.[status];
  if (!requiredRole) {
    throw AppError.badRequest({ status: `Cannot move an issue from "${issue.status}" to "${status}".` });
  }
  if (profile.role !== requiredRole) {
    throw AppError.forbidden(`Only a ${requiredRole.replace('_', ' ')} can make this change.`);
  }

  const inScope =
    (requiredRole === 'municipal_officer' && issue.council_id === profile.council_id) ||
    (requiredRole === 'citizen' && issue.citizen_id === profile.id);
  if (!inScope) throw AppError.notFound('Issue not found.');

  const updates = { status, updated_at: new Date().toISOString() };
  if (status === 'Reopened') {
    const nextReopenedCount = issue.reopened_count + 1;
    updates.reopened_count = nextReopenedCount;
    if (nextReopenedCount >= REOPEN_ESCALATION_THRESHOLD) {
      updates.escalated = true;
      updates.escalated_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .update(updates)
    .eq('id', issueId)
    .select(FULL_COLUMNS)
    .single();
  if (error) throw error;

  await supabaseAdmin
    .from('issue_status_history')
    .insert({ issue_id: issueId, from_status: issue.status, to_status: status, changed_by: profile.id, note: note || null });

  return data;
}
