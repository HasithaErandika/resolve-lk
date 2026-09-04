export type IssueCategory =
  | 'Garbage'
  | 'Road'
  | 'Water'
  | 'Lighting'
  | 'Drainage'
  | 'Sewerage'
  | 'Public Safety'
  | 'Other'
export type IssueStatus = 'Pending' | 'In Progress' | 'Resolved'
export type IssuePriority = 'Low' | 'Medium' | 'Critical'

export interface CivicIssue {
  id: string
  citizenId?: string
  category: IssueCategory
  ward: string
  landmark: string
  description: string
  photoUrl?: string | null
  status: IssueStatus
  aiPriority: IssuePriority
  aiDepartment: string
  aiReason: string
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
export const STATUSES: IssueStatus[] = ['Pending', 'In Progress', 'Resolved']
export const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'Critical']

/**
 * Normalizes an issue object returned by the Express API (snake_case)
 * into a consistent CivicIssue structure (camelCase).
 */
export interface RawIssueData {
  id?: unknown
  citizenId?: unknown
  citizen_id?: unknown
  category?: unknown
  ward?: unknown
  landmark?: unknown
  description?: unknown
  photoUrl?: unknown
  photo_url?: unknown
  status?: unknown
  aiPriority?: unknown
  ai_priority?: unknown
  aiDepartment?: unknown
  ai_department?: unknown
  aiReason?: unknown
  ai_reason?: unknown
  createdAt?: unknown
  created_at?: unknown
  updatedAt?: unknown
  updated_at?: unknown
}

export function normalizeIssue(raw: RawIssueData): CivicIssue {
  const photo = raw.photoUrl ?? raw.photo_url
  const citizen = raw.citizenId ?? raw.citizen_id
  const updated = raw.updatedAt ?? raw.updated_at

  return {
    id: String(raw.id ?? ''),
    citizenId: citizen != null ? String(citizen) : undefined,
    category: (raw.category as IssueCategory) || 'Garbage',
    ward: String(raw.ward ?? ''),
    landmark: String(raw.landmark ?? ''),
    description: String(raw.description ?? ''),
    photoUrl: photo != null ? String(photo) : null,
    status: (raw.status as IssueStatus) || 'Pending',
    aiPriority: (raw.aiPriority ?? raw.ai_priority ?? 'Medium') as IssuePriority,
    aiDepartment: String(raw.aiDepartment ?? raw.ai_department ?? 'Municipal Works'),
    aiReason: String(raw.aiReason ?? raw.ai_reason ?? 'Standard triage assessment'),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: updated != null ? String(updated) : undefined,
  }
}

