import { NEXT_OFFICER_STATUS, type CivicIssue, type IssueStatus } from '../../types/issue'
import { PriorityBadge, EscalatedBadge } from '../Badge'

interface KanbanBoardProps {
  issues: CivicIssue[]
  onSelectIssue: (issue: CivicIssue) => void
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => Promise<void>
  isUpdatingId: string | null
}

const COLUMNS: { key: string; title: string; color: string; bgHeader: string; statuses: IssueStatus[] }[] = [
  { key: 'submitted', title: 'Submitted', color: 'border-t-bark', bgHeader: 'bg-bark/5 text-bark', statuses: ['Submitted'] },
  { key: 'acknowledged', title: 'Acknowledged', color: 'border-t-golden', bgHeader: 'bg-golden/10 text-bark', statuses: ['Acknowledged'] },
  { key: 'in-progress', title: 'In Progress', color: 'border-t-pumpkin', bgHeader: 'bg-pumpkin/10 text-pumpkin', statuses: ['In Progress'] },
  { key: 'reopened', title: 'Reopened', color: 'border-t-maple', bgHeader: 'bg-maple/10 text-maple', statuses: ['Reopened'] },
  { key: 'resolved', title: 'Resolved', color: 'border-t-fern', bgHeader: 'bg-fern/10 text-fern', statuses: ['Resolved', 'Verified'] },
]

export function KanbanBoard({ issues, onSelectIssue, onUpdateStatus, isUpdatingId }: KanbanBoardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const columnIssues = issues.filter((i) => col.statuses.includes(i.status))

        return (
          <div key={col.key} className={`flex flex-col rounded-3xl border border-bark/10 border-t-4 ${col.color} bg-birch/50 p-4 shadow-xs`}>
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-bark">{col.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.bgHeader}`}>{columnIssues.length}</span>
              </div>
            </div>

            <div className="mt-2 space-y-3 flex-1 min-h-[240px]">
              {columnIssues.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-bark/15 bg-white/60 text-center text-xs text-bark/40">
                  No issues here
                </div>
              ) : (
                columnIssues.map((issue) => {
                  const isUpdating = isUpdatingId === issue.id
                  const nextStatus = NEXT_OFFICER_STATUS[issue.status]

                  return (
                    <div
                      key={issue.id}
                      className={`group relative flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                        issue.escalated ? 'border-maple/40 ring-1 ring-maple/20' : 'border-bark/10 hover:border-pumpkin/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-bark/50">#{issue.id.slice(0, 6)}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-pumpkin">{issue.category}</span>
                        </div>
                        <PriorityBadge priority={issue.aiPriority} />
                      </div>

                      {issue.escalated && <div className="mt-1.5"><EscalatedBadge /></div>}

                      <h4
                        onClick={() => onSelectIssue(issue)}
                        className="mt-2.5 font-bold text-sm text-bark cursor-pointer group-hover:text-pumpkin transition"
                      >
                        {issue.ward}
                      </h4>
                      <p className="text-xs text-bark/60">{issue.landmark}</p>

                      <p onClick={() => onSelectIssue(issue)} className="mt-2 line-clamp-2 text-xs leading-relaxed text-bark/75 cursor-pointer">
                        {issue.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-bark/5 pt-2.5">
                        <button
                          type="button"
                          onClick={() => onSelectIssue(issue)}
                          className="text-[11px] font-semibold text-bark/60 hover:text-bark transition"
                        >
                          Details
                        </button>
                        {nextStatus && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(issue.id, nextStatus)}
                            className="rounded-lg bg-pumpkin/10 px-2.5 py-1 text-xs font-semibold text-pumpkin hover:bg-pumpkin hover:text-birch transition disabled:opacity-50"
                          >
                            {isUpdating ? 'Saving' : `Move to ${nextStatus}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
