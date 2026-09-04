import { type CivicIssue, normalizeIssue, type IssueStatus } from '../types/issue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export interface IssueFilters {
  category?: string
  status?: string
  priority?: string
  search?: string
  ward?: string
}

export async function fetchAdminIssues(
  token: string,
  filters?: IssueFilters
): Promise<{ issues: CivicIssue[]; error?: string }> {
  const url = new URL(`${API_BASE_URL}/api/issues`)
  url.searchParams.set('pageSize', '100')
  if (filters?.category && filters.category !== 'All') {
    url.searchParams.set('category', filters.category)
  }
  if (filters?.status && filters.status !== 'All') {
    url.searchParams.set('status', filters.status)
  }
  if (filters?.search) {
    url.searchParams.set('search', filters.search)
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    const data: { issues?: unknown; error?: string } = await res.json()

    if (!res.ok || !Array.isArray(data.issues)) {
      return { issues: [], error: data.error || 'Could not load issues.' }
    }

    let normalized = data.issues.map(normalizeIssue)
    if (filters?.priority && filters.priority !== 'All') {
      normalized = normalized.filter((item) => item.aiPriority === filters.priority)
    }
    if (filters?.ward && filters.ward !== 'All') {
      normalized = normalized.filter((item) => item.ward === filters.ward)
    }

    return { issues: normalized }
  } catch {
    return { issues: [], error: 'Could not reach the server. Please check your connection.' }
  }
}

export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  token: string
): Promise<{ success: boolean; updatedIssue?: CivicIssue; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    })

    const data = await res.json()

    if (!res.ok) {
      const errorMsg = data.error || data.errors?.status || 'Failed to update issue status.'
      return { success: false, error: errorMsg }
    }

    return { success: true, updatedIssue: normalizeIssue(data) }
  } catch {
    return { success: false, error: 'Could not reach the server. Please check your connection.' }
  }
}
