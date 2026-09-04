import { type CivicIssue, type IssueStatus, normalizeIssue } from '../types/issue'
import { sampleIssues } from '../data/sampleIssues'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

// Local in-memory mock store for demo mode or when backend is offline
let mockIssuesStore: CivicIssue[] = sampleIssues.map((issue) => normalizeIssue(issue))

export interface IssueFilters {
  category?: string
  status?: string
  priority?: string
  search?: string
  ward?: string
}


export async function fetchAdminIssues(
  token?: string | null,
  filters?: IssueFilters
): Promise<{ issues: CivicIssue[]; isLive: boolean; error?: string }> {
  if (token && token !== 'demo-admin-token') {
    try {
      const url = new URL(`${API_BASE_URL}/api/issues`)
      if (filters?.category && filters.category !== 'All') {
        url.searchParams.set('category', filters.category)
      }
      if (filters?.status && filters.status !== 'All') {
        url.searchParams.set('status', filters.status)
      }
      if (filters?.search) {
        url.searchParams.set('search', filters.search)
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.ok) {
        const rawData = await res.json()
        if (Array.isArray(rawData)) {
          let normalized = rawData.map(normalizeIssue)
          if (filters?.priority && filters.priority !== 'All') {
            normalized = normalized.filter((item) => item.aiPriority === filters.priority)
          }
          if (filters?.ward && filters.ward !== 'All') {
            normalized = normalized.filter((item) => item.ward === filters.ward)
          }
          // Sync to mock store for seamless fallbacks
          mockIssuesStore = [...normalized]
          return { issues: normalized, isLive: true }
        }
      }
    } catch {
      // Backend is unreachable, seamlessly fall back to local mock data
    }
  }

  // Fallback / Demo Mode
  let result = [...mockIssuesStore]
  if (filters?.category && filters.category !== 'All') {
    result = result.filter((item) => item.category === filters.category)
  }
  if (filters?.status && filters.status !== 'All') {
    result = result.filter((item) => item.status === filters.status)
  }
  if (filters?.priority && filters.priority !== 'All') {
    result = result.filter((item) => item.aiPriority === filters.priority)
  }
  if (filters?.ward && filters.ward !== 'All') {
    result = result.filter((item) => item.ward === filters.ward)
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim()
    result = result.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        item.landmark.toLowerCase().includes(q) ||
        item.ward.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.aiDepartment.toLowerCase().includes(q)
    )
  }

  return { issues: result, isLive: false }
}

/**
 * Updates an issue's status.
 * Calls PATCH /api/issues/:id/status with Authorization header.
 * Automatically handles citizen points bonus logic for 'Resolved'.
 */
export async function updateIssueStatus(
  issueId: string,
  newStatus: IssueStatus,
  token?: string | null
): Promise<{ success: boolean; updatedIssue?: CivicIssue; isLive: boolean; error?: string }> {
  if (token && token !== 'demo-admin-token') {
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

      if (res.ok) {
        const rawUpdated = await res.json()
        const updated = normalizeIssue(rawUpdated)
        // Update in-memory store as well
        mockIssuesStore = mockIssuesStore.map((item) => (item.id === issueId ? updated : item))
        return { success: true, updatedIssue: updated, isLive: true }
      } else {
        const errData = await res.json().catch(() => ({}))
        const errorMsg = errData.error || errData.errors?.status || 'Failed to update issue status'
        return { success: false, isLive: true, error: errorMsg }
      }
    } catch {
      // Offline fallback: fall through to local update
    }
  }

  // Local state update for demo/fallback mode
  let updatedIssue: CivicIssue | undefined
  mockIssuesStore = mockIssuesStore.map((item) => {
    if (item.id === issueId) {
      updatedIssue = { ...item, status: newStatus, updatedAt: new Date().toISOString() }
      return updatedIssue
    }
    return item
  })

  if (updatedIssue) {
    return { success: true, updatedIssue, isLive: false }
  }

  return { success: false, isLive: false, error: 'Issue not found in store' }
}
