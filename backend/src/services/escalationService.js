import { supabaseAdmin } from '../lib/supabaseClient.js';
import { getCouncilIdsForProvince } from './councilService.js';

const OPEN_STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Reopened'];
const AUTO_VERIFY_AFTER_DAYS = 14;

const ESCALATION_COLUMNS =
  'id, council_id, category, ward, landmark, status, ai_priority, sla_ack_due_at, sla_resolve_due_at, ' +
  'escalated_at, reopened_count, created_at, councils(name)';

// The Provincial Officer's escalation queue - see
// docs/srs/03-governance-and-roles.md#sla-targets-and-escalation. Read-only:
// a Provincial Officer cannot change an issue's status directly.
export async function listEscalations(profile, { councilId, page = 1, pageSize = 20 } = {}) {
  const clampedPageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const clampedPage = Math.max(Number(page) || 1, 1);
  const from = (clampedPage - 1) * clampedPageSize;
  const to = from + clampedPageSize - 1;

  const councilIds = await getCouncilIdsForProvince(profile.province_id);
  const scopedIds = councilId ? councilIds.filter((id) => id === councilId) : councilIds;

  let query = supabaseAdmin
    .from('civic_issues')
    .select(ESCALATION_COLUMNS, { count: 'exact' })
    .eq('escalated', true)
    .in('status', OPEN_STATUSES) // once resolved, an escalated issue drops off the active queue
    .in('council_id', scopedIds.length > 0 ? scopedIds : ['00000000-0000-0000-0000-000000000000'])
    .order('escalated_at', { ascending: true })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    issues: (data ?? []).map((row) => ({ ...row, councilName: row.councils?.name ?? null })),
    page: clampedPage,
    pageSize: clampedPageSize,
    total: count ?? data.length,
  };
}

// Scheduled sweep - run periodically (see backend/src/jobs/slaBreachJob.js
// and its `npm run sla:sweep` entrypoint). Not wired into a live scheduler
// in this environment; a real deployment would run it on an hourly cron.
export async function runScheduledSweep() {
  const nowIso = new Date().toISOString();

  const { data: breached, error: breachError } = await supabaseAdmin
    .from('civic_issues')
    .select('id')
    .in('status', OPEN_STATUSES)
    .eq('escalated', false)
    .or(`sla_ack_due_at.lt.${nowIso},sla_resolve_due_at.lt.${nowIso}`);
  if (breachError) throw breachError;

  if (breached?.length > 0) {
    const { error } = await supabaseAdmin
      .from('civic_issues')
      .update({ escalated: true, escalated_at: nowIso })
      .in('id', breached.map((row) => row.id));
    if (error) throw error;
  }

  const cutoffIso = new Date(Date.now() - AUTO_VERIFY_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: staleResolved, error: staleError } = await supabaseAdmin
    .from('civic_issues')
    .select('id')
    .eq('status', 'Resolved')
    .lte('updated_at', cutoffIso);
  if (staleError) throw staleError;

  for (const row of staleResolved ?? []) {
    await supabaseAdmin.from('civic_issues').update({ status: 'Verified', updated_at: nowIso }).eq('id', row.id);
    await supabaseAdmin.from('issue_status_history').insert({
      issue_id: row.id,
      from_status: 'Resolved',
      to_status: 'Verified',
      changed_by: null,
      note: `Auto-verified after ${AUTO_VERIFY_AFTER_DAYS} days with no dispute.`,
    });
  }

  return { escalatedCount: breached?.length ?? 0, autoVerifiedCount: staleResolved?.length ?? 0 };
}
