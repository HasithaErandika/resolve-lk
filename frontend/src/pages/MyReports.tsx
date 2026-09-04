import { useState, type FormEvent } from 'react'
import { IssueCard } from '../components/IssueCard'
import type { CivicIssue } from '../types/issue'

export function MyReports() {
  const [nic, setNic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [reports, setReports] = useState<CivicIssue[]>([])
  const [points, setPoints] = useState(0)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^\d{9}[vVxX]|\d{12}$/.test(nic.trim())) {
      setError('Please enter a valid NIC format')
      return
    }

    setLoading(true)
    try {
      // TODO: Replace with real POST /api/my-reports/login call
      // and supabase.auth.setSession() when backend is integrated.
      await new Promise((resolve) => setTimeout(resolve, 800))
      setLoggedIn(true)
      setPoints(25) // Sample points
      setReports([]) // Empty or sample issues
    } catch (err) {
      setError('Failed to log in. Please try again.')
    } finally {
      setLoading(false)
    }
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
              onClick={() => setLoggedIn(false)}
              className="text-sm font-medium text-maple hover:underline"
            >
              Sign out
            </button>
          </div>
          
          {reports.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-bark/20 bg-white/50 p-12 text-center shadow-sm">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bark/5 text-bark/40">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-semibold text-bark">No reports yet</h3>
              <p className="mt-1 text-sm text-bark/60">Get started by reporting a civic issue in your area.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-bark">My Reports</h2>
          <p className="mt-2 text-bark/60">
            Enter your NIC to view your reported issues and contribution points.
          </p>
        </div>

        <div className="mt-10 max-w-md">
          <form onSubmit={handleLogin} className="space-y-5 rounded-2xl border border-bark/10 bg-white p-6 shadow-sm">
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
