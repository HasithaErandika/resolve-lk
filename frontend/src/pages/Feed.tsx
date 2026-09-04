import { useEffect, useState } from 'react'
import { IssueCard } from '../components/IssueCard'
import { sampleIssues } from '../data/sampleIssues'
import { type CivicIssue, normalizeIssue } from '../types/issue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export function Feed() {
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/issues/public?pageSize=100`)
        if (res.ok) {
          const data: { issues?: unknown } = await res.json()
          if (Array.isArray(data.issues) && !ignore) {
            setIssues(data.issues.map(normalizeIssue))
            setIsLive(true)
            setIsLoading(false)
            return
          }
        }
      } catch {
        // fall through to sample data below
      }
      if (!ignore) {
        setIssues(sampleIssues.map(normalizeIssue))
        setIsLive(false)
        setIsLoading(false)
      }
    }

    void load()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-bark sm:text-3xl">
              Recently reported
            </h2>
            <p className="mt-1 text-sm text-bark/60">Open to everyone — no login required.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
          </div>
        ) : issues.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-bark/20 bg-white/50 p-12 text-center shadow-sm">
            <h3 className="text-sm font-semibold text-bark">No issues reported yet</h3>
            <p className="mt-1 text-sm text-bark/60">Be the first to report a civic issue in your area.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        {!isLive && !isLoading && (
          <p className="mt-6 text-xs text-bark/40">
            Showing sample data — could not reach the live backend.
          </p>
        )}
      </div>
    </section>
  )
}
