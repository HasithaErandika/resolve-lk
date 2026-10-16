import type { IssuePriority, IssueStatus } from '../types/issue'

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  Critical: 'bg-maple text-birch',
  High: 'bg-maple/15 text-maple ring-1 ring-inset ring-maple/30',
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
  Submitted: 'bg-bark/5 text-bark/70 ring-1 ring-inset ring-bark/10',
  Acknowledged: 'bg-golden/20 text-bark ring-1 ring-inset ring-golden/40',
  'In Progress': 'bg-pumpkin/15 text-pumpkin ring-1 ring-inset ring-pumpkin/30',
  Resolved: 'bg-fern/15 text-fern ring-1 ring-inset ring-fern/30',
  Verified: 'bg-fern text-birch',
  Reopened: 'bg-maple/15 text-maple ring-1 ring-inset ring-maple/30',
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

export function EscalatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-maple/15 px-2.5 py-1 text-xs font-semibold text-maple ring-1 ring-inset ring-maple/30">
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.169 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      Overdue
    </span>
  )
}

export function RedirectBadge({ authority }: { authority: string | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-bark/5 px-2.5 py-1 text-xs font-semibold text-bark/70 ring-1 ring-inset ring-bark/10">
      Referred to {authority ?? 'another authority'}
    </span>
  )
}
