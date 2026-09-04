import { useEffect, useState } from 'react'
import { IssueCard } from '../components/IssueCard'
import { IssueDetailModal } from '../components/IssueDetailModal'
import { CATEGORIES, type CivicIssue, normalizeIssue } from '../types/issue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export function Feed() {
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let ignore = false

    async function load() {
      setIsLoading(true)
      try {
        const url = new URL(`${API_BASE_URL}/api/issues/public`)
        url.searchParams.set('pageSize', '100')
        if (debouncedSearch) url.searchParams.set('search', debouncedSearch)
        if (category !== 'All') url.searchParams.set('category', category)

        const res = await fetch(url.toString())
        const data: { issues?: unknown; error?: string } = await res.json()

        if (ignore) return

        if (res.ok && Array.isArray(data.issues)) {
          setIssues(data.issues.map(normalizeIssue))
          setError(null)
        } else {
          setError(data.error || 'Could not load reported issues.')
        }
      } catch {
        if (!ignore) setError('Could not reach the server. Please check your connection.')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    void load()
    return () => {
      ignore = true
    }
  }, [debouncedSearch, category])

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">
            Recently reported
          </h2>
          <p className="mt-2 text-sm text-bark/60">Open to everyone. No login required.</p>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
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
              placeholder="Search by keyword, landmark, or ward…"
              className="w-full rounded-lg border border-bark/15 bg-white py-2.5 pl-10 pr-3 text-sm text-bark outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-bark/15 bg-white px-3 py-2.5 text-sm text-bark outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="mt-10 flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
          </div>
        ) : error ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-maple/20 bg-maple/5 p-12 text-center">
            <h3 className="text-sm font-semibold text-maple">{error}</h3>
            <p className="mt-1 text-sm text-bark/60">Please try again in a moment.</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-bark/15 bg-birch p-12 text-center">
            <h3 className="text-sm font-semibold text-bark">No issues found</h3>
            <p className="mt-1 text-sm text-bark/60">
              {search || category !== 'All'
                ? 'Try a different search term or category.'
                : 'Be the first to report a civic issue in your area.'}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))}
          </div>
        )}
      </div>

      {selectedIssue && (
        <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </section>
  )
}
