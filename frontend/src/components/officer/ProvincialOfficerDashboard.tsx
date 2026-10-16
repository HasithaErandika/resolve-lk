import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useOfficerAuth } from '../../context/useOfficerAuth'
import { fetchEscalations, fetchCouncils, createMunicipalOfficer } from '../../lib/officerApi'
import type { CivicIssue } from '../../types/issue'
import type { Council } from '../../types/council'
import { PriorityBadge } from '../Badge'

export function ProvincialOfficerDashboard({ onBackToPublic }: { onBackToPublic: () => void }) {
  const { user, token, signOut } = useOfficerAuth()
  const [escalations, setEscalations] = useState<(CivicIssue & { councilName?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [councils, setCouncils] = useState<Council[]>([])

  const loadEscalations = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    const { issues, error } = await fetchEscalations(token)
    setEscalations(issues)
    setLoadError(error ?? null)
    setIsLoading(false)
  }, [token])

  useEffect(() => {
    void loadEscalations()
  }, [loadEscalations])

  useEffect(() => {
    void fetchCouncils().then(setCouncils)
  }, [])

  const ownProvinceCouncils = useMemo(
    () => councils.filter((c) => c.provinceId === user?.provinceId),
    [councils, user?.provinceId]
  )

  return (
    <div className="min-h-screen bg-birch text-bark pb-16">
      <header className="sticky top-0 z-40 border-b border-bark/10 bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
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
                  Provincial Officer
                </span>
              </div>
              <p className="text-[11px] text-bark/50 hidden sm:block">Cross-council oversight and escalations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBackToPublic} className="hidden sm:inline-flex rounded-lg border border-bark/15 px-3 py-1.5 text-xs font-semibold text-bark/70 hover:border-pumpkin hover:text-pumpkin transition">
              Public site
            </button>
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-bark truncate max-w-[180px]">{user?.fullName || 'Provincial Officer'}</span>
              <span className="text-[10px] text-bark/50">{user?.email}</span>
            </div>
            <button type="button" onClick={signOut} className="rounded-lg bg-bark/5 px-3 py-1.5 text-xs font-semibold text-bark hover:bg-bark/10 transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-bark">Escalation queue</h2>
              <p className="mt-1 text-sm text-bark/60">
                Issues that breached their target response time, or were disputed more than once, across
                every council in your province. Read only: the owning council makes the fix.
              </p>
            </div>
            <button type="button" onClick={loadEscalations} className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-xs font-semibold text-bark hover:border-pumpkin hover:text-pumpkin transition">
              Refresh
            </button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex justify-center rounded-3xl border border-bark/10 bg-white p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
              </div>
            ) : loadError ? (
              <div className="rounded-3xl border border-maple/20 bg-maple/5 p-8 text-center text-sm font-medium text-maple">{loadError}</div>
            ) : escalations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-bark/20 bg-white p-12 text-center">
                <h3 className="text-sm font-semibold text-bark">No escalations</h3>
                <p className="mt-1 text-xs text-bark/60">Every council in your province is currently within its response targets.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-bark/10 bg-white shadow-sm shadow-bark/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-bark">
                    <thead className="border-b border-bark/10 bg-birch/40 text-xs font-bold uppercase tracking-wider text-bark/60">
                      <tr>
                        <th className="py-3 pl-6 pr-3">Council</th>
                        <th className="px-3 py-3">Category / Ward</th>
                        <th className="px-3 py-3">Priority</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Reopened</th>
                        <th className="py-3 pl-3 pr-6">Reported</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bark/5">
                      {escalations.map((issue) => (
                        <tr key={issue.id} className="bg-maple/[0.02]">
                          <td className="py-3 pl-6 pr-3 font-semibold">{issue.councilName ?? 'Unknown council'}</td>
                          <td className="px-3 py-3">
                            <span className="font-semibold text-pumpkin">{issue.category}</span>
                            <span className="block text-xs text-bark/50">{issue.ward}</span>
                          </td>
                          <td className="px-3 py-3"><PriorityBadge priority={issue.aiPriority} /></td>
                          <td className="px-3 py-3">{issue.status}</td>
                          <td className="px-3 py-3">{issue.reopenedCount}</td>
                          <td className="py-3 pl-3 pr-6 text-xs text-bark/50">
                            {new Date(issue.createdAt).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-bark">Provision a Municipal Officer</h2>
          <p className="mt-1 text-sm text-bark/60">
            Municipal Officer accounts are never self-registered. Create one for a council in your own
            province.
          </p>
          <ProvisionMunicipalOfficerForm token={token} councils={ownProvinceCouncils} />
        </section>
      </main>
    </div>
  )
}

function ProvisionMunicipalOfficerForm({ token, councils }: { token: string | null; councils: Council[] }) {
  const [councilId, setCouncilId] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ tempPassword: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || !councilId || !email.trim()) return

    setIsSubmitting(true)
    setError(null)
    setResult(null)
    const { success, tempPassword, error: submitError } = await createMunicipalOfficer(token, { councilId, email: email.trim(), fullName })
    setIsSubmitting(false)

    if (success && tempPassword) {
      setResult({ tempPassword })
      setEmail('')
      setFullName('')
    } else {
      setError(submitError || 'Could not create this account. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-4 rounded-2xl border border-bark/10 bg-white p-5 sm:grid-cols-3">
      <div>
        <label className="block text-xs font-semibold text-bark/70">Council</label>
        <select
          value={councilId}
          onChange={(e) => setCouncilId(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-3 py-2 text-sm text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
        >
          <option value="">Select a council</option>
          {councils.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-bark/70">Official email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="officer@council.gov.lk"
          className="mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-3 py-2 text-sm text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-bark/70">Full name (optional)</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-3 py-2 text-sm text-bark outline-none focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
        />
      </div>

      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={isSubmitting || !councilId || !email.trim()}
          className="rounded-xl bg-pumpkin px-5 py-2.5 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account' : 'Create account'}
        </button>
        {error && <p className="mt-3 text-sm font-medium text-maple">{error}</p>}
        {result && (
          <p className="mt-3 rounded-lg bg-fern/10 px-3 py-2 text-sm text-fern">
            Account created. Temporary password: <code className="font-mono font-bold">{result.tempPassword}</code>. Relay
            this to the officer securely, it is shown only once.
          </p>
        )}
      </div>
    </form>
  )
}
