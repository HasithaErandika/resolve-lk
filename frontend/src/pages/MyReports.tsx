import { useMemo, useState, type FormEvent } from 'react'
import { IssueCard } from '../components/IssueCard'
import { IssueDetailModal } from '../components/IssueDetailModal'
import { type CivicIssue, normalizeIssue } from '../types/issue'
import { isValidNic } from '../lib/validation'
import { supabase } from '../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export function MyReports() {
  const [nic, setNic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [reports, setReports] = useState<CivicIssue[]>([])
  const [points, setPoints] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null)

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reports
    return reports.filter(
      (issue) =>
        issue.description.toLowerCase().includes(q) ||
        issue.landmark.toLowerCase().includes(q) ||
        issue.ward.toLowerCase().includes(q) ||
        issue.category.toLowerCase().includes(q)
    )
  }, [reports, search])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidNic(nic)) {
      setError('Please enter a valid NIC number: either 9 digits followed by V/X, or 12 digits.')
      return
    }

    setLoading(true)
    try {
      const loginRes = await fetch(`${API_BASE_URL}/api/my-reports/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic: nic.trim() }),
      })
      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        setError(loginData.error || loginData.errors?.nic || 'Could not sign you in. Please try again.')
        return
      }

      const { session } = loginData
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })

      const issuesRes = await fetch(`${API_BASE_URL}/api/issues?pageSize=100`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const issuesData = await issuesRes.json()

      if (issuesRes.ok) {
        setReports(Array.isArray(issuesData.issues) ? issuesData.issues.map(normalizeIssue) : [])
        setPoints(issuesData.points ?? 0)
      }

      setLoggedIn(true)
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setLoggedIn(false)
    setReports([])
    setPoints(0)
    setNic('')
    setSearch('')
    setSelectedIssue(null)
  }

  if (loggedIn) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-bark">
                My Reports
              </h2>
              <p className="mt-2 text-bark/60">
                You have earned <span className="font-semibold text-pumpkin">{points} contribution points</span>.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-maple hover:underline"
            >
              Sign out
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-bark/15 bg-birch p-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bark/5 text-bark/40">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-semibold text-bark">No reports yet</h3>
              <p className="mt-1 text-sm text-bark/60">Get started by reporting a civic issue in your area.</p>
            </div>
          ) : (
            <>
              <div className="relative mt-8 max-w-md">
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
                  placeholder="Search your reports…"
                  className="w-full rounded-lg border border-bark/15 bg-white py-2.5 pl-10 pr-3 text-sm text-bark outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                />
              </div>

              {filteredReports.length === 0 ? (
                <p className="mt-8 text-sm text-bark/50">No reports match your search.</p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredReports.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {selectedIssue && (
          <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
        )}
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">My Reports</h2>
          <p className="mt-2 text-bark/60">
            Enter your NIC to view your reported issues and contribution points.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <form onSubmit={handleLogin} className="space-y-5 rounded-2xl border border-bark/10 bg-white p-6 shadow-sm text-left">
            <div>
              <label htmlFor="nic" className="block text-sm font-medium text-bark">
                NIC number
              </label>
              <input
                id="nic"
                type="text"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                placeholder="e.g. 200112345678"
                className={`mt-1.5 w-full rounded-lg border bg-birch px-3 py-2.5 text-sm text-bark outline-none transition focus:ring-2 ${
                  error
                    ? 'border-maple/50 focus:border-maple focus:ring-maple/20'
                    : 'border-bark/15 focus:border-pumpkin focus:ring-pumpkin/20'
                }`}
              />
              {error && <p className="mt-2 text-xs font-medium text-maple">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-pumpkin px-5 py-3 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                'View My Reports'
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
