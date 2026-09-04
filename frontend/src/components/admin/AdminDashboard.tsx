import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAdminAuth } from '../../context/useAdminAuth'
import { type CivicIssue, type IssueStatus, CATEGORIES, STATUSES, PRIORITIES } from '../../types/issue'
import { WARDS } from '../../data/wards'
import { fetchAdminIssues, updateIssueStatus, type IssueFilters } from '../../lib/adminApi'
import { AdminIssueTable } from './AdminIssueTable'
import { AdminKanbanBoard } from './AdminKanbanBoard'
import { AdminIssueModal } from './AdminIssueModal'

type ViewMode = 'table' | 'kanban'

interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'info' | 'error'
}

export function AdminDashboard({ onBackToPublic }: { onBackToPublic: () => void }) {
  const { user, token, signOut, isDemoMode } = useAdminAuth()

  // Data state
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLiveApi, setIsLiveApi] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)

  // View & Filter states
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [selectedPriority, setSelectedPriority] = useState<string>('All')
  const [selectedWard, setSelectedWard] = useState<string>('All')

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // Synchronize issues with backend / mock API
  useEffect(() => {
    let ignore = false

    async function syncIssues() {
      setIsLoading(true)
      const filters: IssueFilters = {
        category: selectedCategory,
        status: selectedStatus,
        priority: selectedPriority,
        ward: selectedWard,
        search: search,
      }
      const { issues: fetched, isLive } = await fetchAdminIssues(token, filters)
      if (!ignore) {
        setIssues(fetched)
        setIsLiveApi(isLive)
        setIsLoading(false)
      }
    }

    void syncIssues()

    return () => {
      ignore = true
    }
  }, [token, selectedCategory, selectedStatus, selectedPriority, selectedWard, search])

  // Manual refresh callback
  const refreshIssues = useCallback(async () => {
    setIsLoading(true)
    const filters: IssueFilters = {
      category: selectedCategory,
      status: selectedStatus,
      priority: selectedPriority,
      ward: selectedWard,
      search: search,
    }
    const { issues: fetched, isLive } = await fetchAdminIssues(token, filters)
    setIssues(fetched)
    setIsLiveApi(isLive)
    setIsLoading(false)
  }, [token, selectedCategory, selectedStatus, selectedPriority, selectedWard, search])

  // Handle status update
  async function handleStatusUpdate(issueId: string, newStatus: IssueStatus) {
    setIsUpdatingId(issueId)
    const { success, updatedIssue, error } = await updateIssueStatus(
      issueId,
      newStatus,
      token
    )
    setIsUpdatingId(null)

    if (success && updatedIssue) {
      setIssues((prev) =>
        prev.map((item) => (item.id === issueId ? updatedIssue : item))
      )
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(updatedIssue)
      }

      if (newStatus === 'Resolved') {
        addToast(
          `Issue #${issueId.slice(0, 6)} resolved! Reporting citizen awarded +15 bonus points.`,
          'success'
        )
      } else {
        addToast(`Issue #${issueId.slice(0, 6)} updated to "${newStatus}".`, 'info')
      }
    } else {
      addToast(error || 'Failed to update issue status', 'error')
    }
  }

  // Summary statistics metrics
  const stats = useMemo(() => {
    const total = issues.length
    const critical = issues.filter((i) => i.aiPriority === 'Critical' && i.status !== 'Resolved').length
    const pending = issues.filter((i) => i.status === 'Pending').length
    const inProgress = issues.filter((i) => i.status === 'In Progress').length
    const resolved = issues.filter((i) => i.status === 'Resolved').length
    return { total, critical, pending, inProgress, resolved }
  }, [issues])

  // Reset filters
  function resetFilters() {
    setSearch('')
    setSelectedCategory('All')
    setSelectedStatus('All')
    setSelectedPriority('All')
    setSelectedWard('All')
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    selectedPriority !== 'All' ||
    selectedWard !== 'All'

  return (
    <div className="min-h-screen bg-birch text-bark pb-16">
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
              toast.type === 'success'
                ? 'bg-fern text-birch shadow-fern/20'
                : toast.type === 'error'
                ? 'bg-maple text-birch shadow-maple/20'
                : 'bg-bark text-birch shadow-bark/20'
            }`}
          >
            {toast.type === 'success' && (
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Top Console Navigation Bar */}
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
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-bark/50 hidden sm:block">
                Municipal Council Operations &amp; Issue Dispatch
              </p>
            </div>
          </div>

          {/* Right actions: user badge, return to public, logout */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPublic}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-bark/15 px-3 py-1.5 text-xs font-semibold text-bark/70 hover:border-pumpkin hover:text-pumpkin transition"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                  clipRule="evenodd"
                />
              </svg>
              Public Site
            </button>

            {/* Admin identity chip */}
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-bark truncate max-w-[180px]">
                {user?.fullName || 'Municipal Officer'}
              </span>
              <span className="text-[10px] text-bark/50">{user?.email}</span>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg bg-bark/5 px-3 py-1.5 text-xs font-semibold text-bark hover:bg-bark/10 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Console Content */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Status Mode Indicator Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bark/10 bg-white px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isLiveApi ? 'bg-fern animate-pulse' : 'bg-golden'
              }`}
            />
            <span className="text-xs font-medium text-bark/80">
              {isLiveApi ? (
                <span>
                  Backend Connected to Express (Port 8787) · Authenticated via Supabase JWT
                </span>
              ) : isDemoMode ? (
                <span>
                  <strong>Demo Mode Active</strong> · Using local verified municipal seed data
                </span>
              ) : (
                <span>Local Development Mode</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-bark/50">
            <span>Sri Lanka Local Time:</span>
            <span className="font-mono font-semibold text-bark">
              {new Date().toLocaleDateString('en-LK', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* KPI Summary Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Reports */}
          <div className="rounded-2xl border border-bark/10 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-bark/50 uppercase tracking-wider">
              Total Reports
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-bark">{stats.total}</span>
              <span className="text-xs font-bold text-bark/40">In Queue</span>
            </div>
          </div>

          {/* Critical Priority Flag */}
          <div
            className={`rounded-2xl border p-4 shadow-xs ${
              stats.critical > 0
                ? 'border-maple/30 bg-maple/5 ring-1 ring-maple/20'
                : 'border-bark/10 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  stats.critical > 0 ? 'text-maple' : 'text-bark/50'
                }`}
              >
                Critical Alert
              </span>
              {stats.critical > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-maple animate-ping" />
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-2xl font-extrabold ${
                  stats.critical > 0 ? 'text-maple' : 'text-bark'
                }`}
              >
                {stats.critical}
              </span>
              <span className="text-[11px] font-medium text-bark/50">Urgent action</span>
            </div>
          </div>

          {/* Pending Triage */}
          <div className="rounded-2xl border border-bark/10 bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold text-bark/50 uppercase tracking-wider">
              Pending Triage
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-bark">{stats.pending}</span>
              <span className="text-[11px] font-medium text-bark/50">Unassigned</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="rounded-2xl border border-pumpkin/20 bg-pumpkin/5 p-4 shadow-xs">
            <span className="text-xs font-semibold text-pumpkin uppercase tracking-wider">
              In Progress
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-pumpkin">{stats.inProgress}</span>
              <span className="text-[11px] font-medium text-pumpkin/70">Crews Active</span>
            </div>
          </div>

          {/* Resolved */}
          <div className="rounded-2xl border border-fern/20 bg-fern/5 p-4 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-fern uppercase tracking-wider">
              Resolved
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-fern">{stats.resolved}</span>
              <span className="text-[11px] font-bold text-fern/80">+15 pts bonus</span>
            </div>
          </div>
        </div>

        {/* Controls Toolbar: Search, Filters & View Toggle */}
        <div className="mt-8 rounded-3xl border border-bark/10 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4">
            {/* Top row: Search input + View mode toggle + Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  viewBox="0 0 20 20"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/40"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by keyword, landmark, ward, or description…"
                  className="w-full rounded-xl border border-bark/15 bg-white pl-10 pr-9 py-2 text-xs sm:text-sm text-bark placeholder:text-bark/40 outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bark/40 hover:text-bark text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View toggle (Table vs Kanban) & Refresh */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-bark/15 bg-bark/5 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                      viewMode === 'table'
                        ? 'bg-white text-bark shadow-xs'
                        : 'text-bark/60 hover:text-bark'
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 012.75-1.5h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                      viewMode === 'kanban'
                        ? 'bg-white text-bark shadow-xs'
                        : 'text-bark/60 hover:text-bark'
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path d="M2 3.75A.75.75 0 012.75 3h3.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-3.5a.75.75 0 01-.75-.75V3.75zm6.5 0a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-3.5a.75.75 0 01-.75-.75V3.75zm7.25-.75a.75.75 0 00-.75.75v12.5a.75.75 0 00.75.75h3.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-3.5z" />
                    </svg>
                    Kanban
                  </button>
                </div>

                <button
                  type="button"
                  onClick={refreshIssues}
                  title="Refresh Issues"
                  className="rounded-xl border border-bark/15 bg-white p-2.5 text-bark/60 hover:border-pumpkin hover:text-pumpkin transition shadow-xs"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.75a.75.75 0 00-.75.75v4.482a.75.75 0 001.5 0v-2.02l.487.487a7 7 0 0011.968-3.324.75.75 0 00-1.643-.54zm-10.624-2.848a5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5H16.25a.75.75 0 00.75-.75V2.689a.75.75 0 00-1.5 0v2.02l-.487-.487a7 7 0 00-11.968 3.324.75.75 0 001.643.54z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns row */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                >
                  <option value="All">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Priority */}
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">
                  AI Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                >
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward / Zone */}
              <div>
                <label className="block text-[11px] font-bold text-bark/60 uppercase tracking-wider mb-1">
                  Ward / Zone
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full rounded-xl border border-bark/15 bg-white px-2.5 py-1.5 text-xs text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                >
                  <option value="All">All Wards</option>
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full rounded-xl border border-bark/15 bg-white py-1.5 text-xs font-semibold text-pumpkin hover:bg-pumpkin/5 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Rendering */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-bark/10 bg-white p-16">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-bark/60">
                Loading municipal civic issues…
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <AdminIssueTable
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onUpdateStatus={handleStatusUpdate}
              isUpdatingId={isUpdatingId}
            />
          ) : (
            <AdminKanbanBoard
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onUpdateStatus={handleStatusUpdate}
              isUpdatingId={isUpdatingId}
            />
          )}
        </div>
      </main>

      {/* Detailed Inspection Modal */}
      {selectedIssue && (
        <AdminIssueModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdateStatus={handleStatusUpdate}
          isUpdating={isUpdatingId === selectedIssue.id}
        />
      )}
    </div>
  )
}
