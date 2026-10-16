import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOfficerAuth } from '../../context/useOfficerAuth'
import { type CivicIssue, type IssueStatus, CATEGORIES, STATUSES, PRIORITIES } from '../../types/issue'
import { fetchOfficerIssues, updateIssueStatus, type IssueFilters } from '../../lib/officerApi'
import { IssueTable } from './IssueTable'
import { KanbanBoard } from './KanbanBoard'
import { IssueModal } from './IssueModal'

type ViewMode = 'table' | 'kanban'

interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'info' | 'error'
}

export function MunicipalOfficerDashboard({ onBackToPublic }: { onBackToPublic: () => void }) {
  const { user, token, signOut } = useOfficerAuth()

  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [selectedPriority, setSelectedPriority] = useState<string>('All')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const currentFilters: IssueFilters = useMemo(
    () => ({ category: selectedCategory, status: selectedStatus, priority: selectedPriority, search: debouncedSearch }),
    [selectedCategory, selectedStatus, selectedPriority, debouncedSearch]
  )

  const loadIssues = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    const { issues: fetched, error } = await fetchOfficerIssues(token, currentFilters)
    setIssues(fetched)
    setLoadError(error ?? null)
    setIsLoading(false)
  }, [token, currentFilters])

  useEffect(() => {
    void loadIssues()
  }, [loadIssues])

  async function handleStatusUpdate(issueId: string, newStatus: IssueStatus) {
    if (!token) return
    setIsUpdatingId(issueId)
    const { success, updatedIssue, error } = await updateIssueStatus(issueId, newStatus, token)
    setIsUpdatingId(null)

    if (success && updatedIssue) {
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updatedIssue : item)))
      if (selectedIssue && selectedIssue.id === issueId) setSelectedIssue(updatedIssue)
      addToast(`Issue #${issueId.slice(0, 6)} moved to "${newStatus}".`, 'success')
    } else {
      addToast(error || 'Failed to update issue status.', 'error')
    }
  }

  const stats = useMemo(() => {
    const total = issues.length
    const actionable = issues.filter((i) => i.aiJurisdiction === 'in_council').length
    const escalated = issues.filter((i) => i.escalated).length
    const inProgress = issues.filter((i) => i.status === 'In Progress').length
    const resolved = issues.filter((i) => i.status === 'Resolved' || i.status === 'Verified').length
    return { total, actionable, escalated, inProgress, resolved }
  }, [issues])

  function resetFilters() {
    setSearch('')
    setSelectedCategory('All')
    setSelectedStatus('All')
    setSelectedPriority('All')
  }

  const hasActiveFilters =
    search.trim() !== '' || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedPriority !== 'All'

  return (
    <div className="min-h-screen bg-birch text-bark pb-16">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
              toast.type === 'success' ? 'bg-fern text-birch shadow-fern/20' : toast.type === 'error' ? 'bg-maple text-birch shadow-maple/20' : 'bg-bark text-birch shadow-bark/20'
            }`}
          >
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      <header className="sticky top-0 z-40 border-b border-bark/10 bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bark text-birch shadow-xs">
              <img src="/resolve-lk-logo.png" alt="" className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-bark">
                  Resolve <span className="text-pumpkin">LK</span>
                </span>
                <span className="rounded-md bg-pumpkin/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pumpkin">
                  Municipal Officer
                </span>
              </div>
              <p className="text-[11px] text-bark/50 hidden sm:block">Council issue queue and dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPublic}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-bark/15 px-3 py-1.5 text-xs font-semibold text-bark/70 hover:border-pumpkin hover:text-pumpkin transition"
            >
              Public site
            </button>
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-bark truncate max-w-[180px]">{user?.fullName || 'Municipal Officer'}</span>
              <span className="text-[10px] text-bark/50">{user?.email}</span>
            </div>
            <button type="button" onClick={signOut} className="rounded-lg bg-bark/5 px-3 py-1.5 text-xs font-semibold text-bark hover:bg-bark/10 transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-bark/10 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-bark/50 uppercase tracking-wider">Total</span>
            <div className="mt-2 text-2xl font-extrabold text-bark">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-bark/10 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-bark/50 uppercase tracking-wider">Actionable</span>
            <div className="mt-2 text-2xl font-extrabold text-bark">{stats.actionable}</div>
          </div>
          <div className={`rounded-2xl border p-4 shadow-xs ${stats.escalated > 0 ? 'border-maple/30 bg-maple/5 ring-1 ring-maple/20' : 'border-bark/10 bg-white'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${stats.escalated > 0 ? 'text-maple' : 'text-bark/50'}`}>Overdue</span>
            <div className={`mt-2 text-2xl font-extrabold ${stats.escalated > 0 ? 'text-maple' : 'text-bark'}`}>{stats.escalated}</div>
          </div>
          <div className="rounded-2xl border border-pumpkin/20 bg-pumpkin/5 p-4 shadow-xs">
            <span className="text-xs font-semibold text-pumpkin uppercase tracking-wider">In progress</span>
            <div className="mt-2 text-2xl font-extrabold text-pumpkin">{stats.inProgress}</div>
          </div>
          <div className="rounded-2xl border border-fern/20 bg-fern/5 p-4 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-fern uppercase tracking-wider">Resolved</span>
            <div className="mt-2 text-2xl font-extrabold text-fern">{stats.resolved}</div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-bark/10 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by keyword, landmark, ward, or description"
                  className="w-full rounded-xl border border-bark/15 bg-white px-3.5 py-2 text-xs sm:text-sm text-bark placeholder:text-bark/40 outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-bark/15 bg-bark/5 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`rounded-lg px-3 py-1.5 transition ${viewMode === 'table' ? 'bg-white text-bark shadow-xs' : 'text-bark/60 hover:text-bark'}`}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`rounded-lg px-3 py-1.5 transition ${viewMode === 'kanban' ? 'bg-white text-bark shadow-xs' : 'text-bark/60 hover:text-bark'}`}
                  >
                    Board
                  </button>
                </div>
                <button
                  type="button"
                  onClick={loadIssues}
                  title="Refresh"
                  className="rounded-xl border border-bark/15 bg-white p-2.5 text-bark/60 hover:border-pumpkin hover:text-pumpkin transition shadow-xs"
                >
                  <svg viewBox="0 0 20 20" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.75a.75.75 0 00-.75.75v4.482a.75.75 0 001.5 0v-2.02l.487.487a7 7 0 0011.968-3.324.75.75 0 00-1.643-.54zm-10.624-2.848a5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5H16.25a.75.75 0 00.75-.75V2.689a.75.75 0 00-1.5 0v2.02l-.487-.487a7 7 0 00-11.968 3.324.75.75 0 001.643.54z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20">
                  <option value="All">All categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20">
                  <option value="All">All statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">Priority</label>
                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20">
                  <option value="All">All priorities</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button type="button" onClick={resetFilters} className="w-full rounded-xl border border-bark/15 bg-white py-1.5 text-xs font-semibold text-pumpkin hover:bg-pumpkin/5 transition">
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-bark/10 bg-white p-16">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-bark/60">Loading issues</p>
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-maple/20 bg-maple/5 p-8 text-center text-sm font-medium text-maple">{loadError}</div>
          ) : viewMode === 'table' ? (
            <IssueTable issues={issues} onSelectIssue={setSelectedIssue} onUpdateStatus={handleStatusUpdate} isUpdatingId={isUpdatingId} />
          ) : (
            <KanbanBoard issues={issues} onSelectIssue={setSelectedIssue} onUpdateStatus={handleStatusUpdate} isUpdatingId={isUpdatingId} />
          )}
        </div>
      </main>

      {selectedIssue && (
        <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} onUpdateStatus={handleStatusUpdate} isUpdating={isUpdatingId === selectedIssue.id} />
      )}
    </div>
  )
}
