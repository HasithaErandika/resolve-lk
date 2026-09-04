import { IssueCard } from '../components/IssueCard'
import { sampleIssues } from '../data/sampleIssues'

export function Feed() {
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sampleIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
        <p className="mt-6 text-xs text-bark/40">
          Sample data shown — replace with a live call to GET /api/issues/public.
        </p>
      </div>
    </section>
  )
}
