export type IssueCategory =
  | 'Garbage'
  | 'Road'
  | 'Water'
  | 'Lighting'
  | 'Drainage'
  | 'Sewerage'
  | 'Public Safety'
  | 'Other'
export type IssueStatus = 'Submitted' | 'Acknowledged' | 'In Progress' | 'Resolved' | 'Verified' | 'Reopened'
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type IssueJurisdiction = 'in_council' | 'redirect'
export type RedirectAuthority = 'NWSDB' | 'RDA' | 'PRDA' | 'CEB' | 'Police' | 'Other'

export interface CivicIssue {
  id: string
  citizenId?: string
  councilId: string
  category: IssueCategory
  ward: string
  landmark: string
  description: string
  photoUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  status: IssueStatus
  aiPriority: IssuePriority
  aiJurisdiction: IssueJurisdiction
  aiRedirectAuthority: RedirectAuthority | null
  aiDepartment: string | null
  aiReason: string
  slaAckDueAt: string
  slaResolveDueAt: string
  escalated: boolean
  reopenedCount: number
  createdAt: string
  updatedAt?: string
}

export const CATEGORIES: IssueCategory[] = [
  'Garbage',
  'Road',
  'Water',
  'Lighting',
  'Drainage',
  'Sewerage',
  'Public Safety',
  'Other',
]
export const STATUSES: IssueStatus[] = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Verified', 'Reopened']
export const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical']

// The next status a Municipal Officer can move an issue to, or null if none
// (Resolved -> Verified/Reopened is the reporting citizen's action, not the
// officer's). Mirrors backend/src/services/issueService.js#ALLOWED_TRANSITIONS.
export const NEXT_OFFICER_STATUS: Partial<Record<IssueStatus, IssueStatus>> = {
  Submitted: 'Acknowledged',
  Acknowledged: 'In Progress',
  'In Progress': 'Resolved',
  Reopened: 'In Progress',
}

/**
 * Normalizes an issue object returned by the Express API (snake_case)
 * into a consistent CivicIssue structure (camelCase).
 */
export interface RawIssueData {
  id?: unknown
  citizenId?: unknown
  citizen_id?: unknown
  councilId?: unknown
  council_id?: unknown
  category?: unknown
  ward?: unknown
  landmark?: unknown
  description?: unknown
  photoUrl?: unknown
  photo_url?: unknown
  latitude?: unknown
  longitude?: unknown
  status?: unknown
  aiPriority?: unknown
  ai_priority?: unknown
  aiJurisdiction?: unknown
  ai_jurisdiction?: unknown
  aiRedirectAuthority?: unknown
  ai_redirect_authority?: unknown
  aiDepartment?: unknown
  ai_department?: unknown
  aiReason?: unknown
  ai_reason?: unknown
  slaAckDueAt?: unknown
  sla_ack_due_at?: unknown
  slaResolveDueAt?: unknown
  sla_resolve_due_at?: unknown
  escalated?: unknown
  reopenedCount?: unknown
  reopened_count?: unknown
  createdAt?: unknown
  created_at?: unknown
  updatedAt?: unknown
  updated_at?: unknown
}

export function normalizeIssue(raw: RawIssueData): CivicIssue {
  const photo = raw.photoUrl ?? raw.photo_url
  const citizen = raw.citizenId ?? raw.citizen_id
  const council = raw.councilId ?? raw.council_id
  const updated = raw.updatedAt ?? raw.updated_at

  return {
    id: String(raw.id ?? ''),
    citizenId: citizen != null ? String(citizen) : undefined,
    councilId: String(council ?? ''),
    category: (raw.category as IssueCategory) || 'Garbage',
    ward: String(raw.ward ?? ''),
    landmark: String(raw.landmark ?? ''),
    description: String(raw.description ?? ''),
    photoUrl: photo != null ? String(photo) : null,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    status: (raw.status as IssueStatus) || 'Submitted',
    aiPriority: (raw.aiPriority ?? raw.ai_priority ?? 'Medium') as IssuePriority,
    aiJurisdiction: (raw.aiJurisdiction ?? raw.ai_jurisdiction ?? 'in_council') as IssueJurisdiction,
    aiRedirectAuthority: (raw.aiRedirectAuthority ?? raw.ai_redirect_authority ?? null) as RedirectAuthority | null,
    aiDepartment: (raw.aiDepartment ?? raw.ai_department ?? null) as string | null,
    aiReason: String(raw.aiReason ?? raw.ai_reason ?? 'Standard triage assessment'),
    slaAckDueAt: String(raw.slaAckDueAt ?? raw.sla_ack_due_at ?? ''),
    slaResolveDueAt: String(raw.slaResolveDueAt ?? raw.sla_resolve_due_at ?? ''),
    escalated: Boolean(raw.escalated),
    reopenedCount: Number(raw.reopenedCount ?? raw.reopened_count ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: updated != null ? String(updated) : undefined,
  }
}
