import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AppError } from '../utils/AppError.js';

const PUBLIC_COLUMNS =
  'id, category, ward, landmark, description, photo_url, status, ai_priority, ai_department, ai_reason, created_at';
const FULL_COLUMNS = `${PUBLIC_COLUMNS}, citizen_id, updated_at`;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function toRange(query) {
  const pageSize = Math.min(Math.max(Number(query.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number(query.page) || 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to, page, pageSize };
}

function applyFilters(query, { category, status, search }) {
  let result = query;
  if (category) result = result.eq('category', category);
  if (status) result = result.eq('status', status);
  if (search) result = result.or(`description.ilike.%${search}%,landmark.ilike.%${search}%`);
  return result;
}

export async function createIssue({ citizenId, category, ward, landmark, description, photoUrl, triage }) {
  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .insert({
      citizen_id: citizenId,
      category,
      ward,
      landmark,
      description,
      photo_url: photoUrl,
      ai_priority: triage.priority,
      ai_department: triage.department,
      ai_reason: triage.reason,
    })
    .select(FULL_COLUMNS)
    .single();

  if (error) throw error;
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

export async function listIssuesForViewer(profile, filters) {
  const { from, to, page, pageSize } = toRange(filters);

  let query = supabaseAdmin
    .from('civic_issues')
    .select(FULL_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (profile.role !== 'admin') {
    query = query.eq('citizen_id', profile.id);
  }
  query = applyFilters(query, filters);

  const { data, error, count } = await query;
  if (error) throw error;

  return { issues: data, page, pageSize, total: count ?? data.length };
}

export async function getIssueForViewer(profile, issueId) {
  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .select(FULL_COLUMNS)
    .eq('id', issueId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw AppError.notFound('Issue not found.');
  if (profile.role !== 'admin' && data.citizen_id !== profile.id) {
    throw AppError.notFound('Issue not found.');
  }

  return data;
}

export async function updateIssueStatus(issueId, status) {
  const { data, error } = await supabaseAdmin
    .from('civic_issues')
    .update({ status })
    .eq('id', issueId)
    .select(FULL_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw AppError.notFound('Issue not found.');
  return data;
}
