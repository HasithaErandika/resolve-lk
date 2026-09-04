import type { CivicIssue } from '../types/issue'
import { PriorityBadge, StatusBadge } from './Badge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function IssueCard({ issue, onClick }: { issue: CivicIssue; onClick?: () => void }) {
  return (
    <article
      onClick={onClick}
      className={`flex flex-col rounded-2xl border border-bark/10 bg-white p-5 shadow-sm shadow-bark/5 transition hover:shadow-md hover:shadow-bark/10 ${
        onClick ? 'cursor-pointer hover:border-pumpkin/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-pumpkin">
          {issue.category}
        </span>
        <PriorityBadge priority={issue.aiPriority} />
      </div>

      <h3 className="mt-2 font-semibold text-bark">{issue.ward}</h3>
      <p className="mt-0.5 text-sm text-bark/60">{issue.landmark}</p>
      <p className="mt-3 line-clamp-2 text-sm text-bark/70">{issue.description}</p>

      <div className="mt-4 flex items-center justify-between border-t border-bark/10 pt-3">
        <StatusBadge status={issue.status} />
        <time className="text-xs text-bark/40" dateTime={issue.createdAt}>
          {formatDate(issue.createdAt)}
        </time>
      </div>
    </article>
  )
}
