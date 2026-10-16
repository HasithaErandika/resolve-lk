import { useMemo, useState, type FormEvent } from 'react'
import { IssueCard } from '../components/IssueCard'
import { IssueDetailModal } from '../components/IssueDetailModal'
import { type CivicIssue, normalizeIssue } from '../types/issue'
import { isValidNic } from '../lib/validation'
import { supabase } from '../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

type Step = 'nic' | 'code' | 'reports'

export function MyReports() {
  const [step, setStep] = useState<Step>('nic')
  const [nic, setNic] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<CivicIssue[]>([])
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  async function loadReports(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/issues?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok) setReports(Array.isArray(data.issues) ? data.issues.map(normalizeIssue) : [])
  }

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidNic(nic)) {
      setError('Please enter a valid NIC number: either 9 digits followed by V/X, or 12 digits.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/my-reports/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic: nic.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Could not send a verification code. Please try again.')
        return
      }
      setStep('code')
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Please enter the 6-digit code sent to your email.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/my-reports/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic: nic.trim(), code: code.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || data.errors?.code || 'That code is invalid or has expired. Request a new one.')
        return
      }

      const { session } = data
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
      await loadReports(session.access_token)
      setStep('reports')
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmOrDispute(issue: CivicIssue, action: 'Verified' | 'Reopened') {
    setActionError(null)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`${API_BASE_URL}/api/issues/${issue.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ status: action }),
    })
    const data = await res.json()

    if (!res.ok) {
      setActionError(data.error || 'Could not update this report. Please try again.')
      return
    }

    const updated = normalizeIssue(data)
    setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    if (selectedIssue?.id === updated.id) setSelectedIssue(updated)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setStep('nic')
    setReports([])
    setNic('')
    setCode('')
    setSearch('')
    setSelectedIssue(null)
  }

  if (step === 'reports') {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-bark">My Reports</h2>
              <p className="mt-2 text-bark/60">{reports.length} report{reports.length === 1 ? '' : 's'} on file.</p>
            </div>
            <button onClick={handleSignOut} className="text-sm font-medium text-maple hover:underline">
              Sign out
            </button>
          </div>

          {actionError && (
            <p className="mt-4 rounded-lg bg-maple/10 px-3 py-2 text-sm font-medium text-maple">{actionError}</p>
          )}

          {reports.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-bark/15 bg-birch p-12 text-center">
              <h3 className="mt-4 text-sm font-semibold text-bark">No reports yet</h3>
              <p className="mt-1 text-sm text-bark/60">Get started by reporting a civic issue in your area.</p>
            </div>
          ) : (
            <>
              <div className="relative mt-8 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your reports…"
                  className="w-full rounded-lg border border-bark/15 bg-white py-2.5 px-3.5 text-base sm:text-sm text-bark outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((issue) => (
                  <div key={issue.id} className="flex flex-col gap-2">
                    <IssueCard issue={issue} onClick={() => setSelectedIssue(issue)} />
                    {issue.status === 'Resolved' && (
                      <div className="flex gap-2 px-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmOrDispute(issue, 'Verified')}
                          className="flex-1 rounded-lg bg-fern px-3 py-1.5 text-xs font-semibold text-birch"
                        >
                          Confirm fixed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmOrDispute(issue, 'Reopened')}
                          className="flex-1 rounded-lg border border-maple/30 px-3 py-1.5 text-xs font-semibold text-maple"
                        >
                          Not actually fixed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedIssue && <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">My Reports</h2>
          <p className="mt-2 text-bark/60">
            {step === 'nic'
              ? 'Enter your NIC to view your reported issues. We will send a one-time code to the email on file, there is no password.'
              : 'Enter the 6-digit code we sent to your email.'}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          {step === 'nic' ? (
            <form onSubmit={handleRequestCode} className="space-y-5 rounded-2xl border border-bark/10 bg-white p-6 shadow-sm text-left">
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
                  className={`mt-1.5 w-full rounded-lg border bg-birch px-3 py-2.5 text-base sm:text-sm text-bark outline-none transition focus:ring-2 ${
                    error ? 'border-maple/50 focus:border-maple focus:ring-maple/20' : 'border-bark/15 focus:border-pumpkin focus:ring-pumpkin/20'
                  }`}
                />
                {error && <p className="mt-2 text-xs font-medium text-maple">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-pumpkin px-5 py-3 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90 disabled:opacity-70"
              >
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5 rounded-2xl border border-bark/10 bg-white p-6 shadow-sm text-left">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-bark">
                  6-digit code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="482913"
                  className={`mt-1.5 w-full rounded-lg border bg-birch px-3 py-2.5 text-base sm:text-sm text-bark outline-none transition focus:ring-2 ${
                    error ? 'border-maple/50 focus:border-maple focus:ring-maple/20' : 'border-bark/15 focus:border-pumpkin focus:ring-pumpkin/20'
                  }`}
                />
                {error && <p className="mt-2 text-xs font-medium text-maple">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-pumpkin px-5 py-3 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90 disabled:opacity-70"
              >
                {loading ? 'Verifying…' : 'Verify and continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('nic')
                  setCode('')
                  setError(null)
                }}
                className="w-full text-center text-xs font-medium text-bark/50 hover:text-bark"
              >
                Use a different NIC
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
