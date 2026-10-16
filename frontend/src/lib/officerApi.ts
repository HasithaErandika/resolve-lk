import { type CivicIssue, normalizeIssue, type IssueStatus, type RawIssueData } from '../types/issue'
import type { Council, CouncilStats, NearestCouncilSuggestion, Province } from '../types/council'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export interface IssueFilters {
  category?: string
  status?: string
  priority?: string
  search?: string
}

async function authorizedJson<T>(path: string, token: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...init?.headers,
      },
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || data.errors?.[Object.keys(data.errors ?? {})[0]] || 'Request failed.' }
    return { data }
  } catch {
    return { error: 'Could not reach the server. Please check your connection.' }
  }
}

export async function fetchOfficerIssues(
  token: string,
  filters?: IssueFilters
): Promise<{ issues: CivicIssue[]; error?: string }> {
  const params = new URLSearchParams({ pageSize: '100' })
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category)
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status)
  if (filters?.search) params.set('search', filters.search)

  const { data, error } = await authorizedJson<{ issues: unknown[] }>(`/api/issues?${params}`, token)
  if (error || !Array.isArray(data?.issues)) return { issues: [], error: error || 'Could not load issues.' }

  let normalized = data.issues.map((item) => normalizeIssue(item as RawIssueData))
  if (filters?.priority && filters.priority !== 'All') {
    normalized = normalized.filter((item) => item.aiPriority === filters.priority)
  }
  return { issues: normalized }
}

export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  token: string,
  note?: string
): Promise<{ success: boolean; updatedIssue?: CivicIssue; error?: string }> {
  const { data, error } = await authorizedJson<Record<string, unknown>>(`/api/issues/${issueId}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus, note }),
  })
  if (error || !data) return { success: false, error }
  return { success: true, updatedIssue: normalizeIssue(data) }
}

export async function fetchEscalations(
  token: string
): Promise<{ issues: (CivicIssue & { councilName?: string })[]; error?: string }> {
  const { data, error } = await authorizedJson<{ issues: unknown[] }>('/api/provincial/escalations?pageSize=100', token)
  if (error || !Array.isArray(data?.issues)) return { issues: [], error: error || 'Could not load escalations.' }
  return {
    issues: data.issues.map((row) => ({
      ...normalizeIssue(row as RawIssueData),
      councilName: (row as { councilName?: string }).councilName,
    })),
  }
}

export async function createMunicipalOfficer(
  token: string,
  input: { councilId: string; email: string; fullName?: string }
): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
  const { data, error } = await authorizedJson<{ tempPassword: string }>('/api/provincial/municipal-officers', token, {
    method: 'POST',
    body: JSON.stringify({ council_id: input.councilId, email: input.email, full_name: input.fullName }),
  })
  if (error || !data) return { success: false, error }
  return { success: true, tempPassword: data.tempPassword }
}

// Public endpoints - no token required.

export async function fetchCouncils(): Promise<Council[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/councils`)
    const data = await res.json()
    return Array.isArray(data.councils) ? data.councils : []
  } catch {
    return []
  }
}

export async function fetchProvinces(): Promise<Province[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/provinces`)
    const data = await res.json()
    return Array.isArray(data.provinces) ? data.provinces : []
  } catch {
    return []
  }
}

export async function fetchCouncilStats(councilId?: string): Promise<CouncilStats[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/councils/stats`)
    if (councilId) url.searchParams.set('council_id', councilId)
    const res = await fetch(url)
    const data = await res.json()
    return Array.isArray(data.stats) ? data.stats : []
  } catch {
    return []
  }
}

export async function fetchNearestCouncil(latitude: number, longitude: number): Promise<NearestCouncilSuggestion | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/councils/nearest?latitude=${latitude}&longitude=${longitude}`)
    const data = await res.json()
    return data.nearest ?? null
  } catch {
    return null
  }
}
