import type { IssuePriority, IssueStatus } from '../types/issue'

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  Critical: 'bg-maple text-birch',
  Medium: 'bg-golden/25 text-bark ring-1 ring-inset ring-golden/50',
  Low: 'bg-bark/5 text-bark/60 ring-1 ring-inset ring-bark/10',
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
    >
      {priority === 'Critical' && <span className="h-1.5 w-1.5 rounded-full bg-birch" aria-hidden />}
      {priority}
    </span>
  )
}

const STATUS_STYLES: Record<IssueStatus, string> = {
  Pending: 'bg-bark/5 text-bark/70 ring-1 ring-inset ring-bark/10',
  'In Progress': 'bg-pumpkin/15 text-pumpkin ring-1 ring-inset ring-pumpkin/30',
  Resolved: 'bg-fern/15 text-fern ring-1 ring-inset ring-fern/30',
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}
