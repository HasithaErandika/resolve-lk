import { type CivicIssue, type IssueStatus } from '../../types/issue'
import { PriorityBadge } from '../Badge'

interface AdminKanbanBoardProps {
  issues: CivicIssue[]
  onSelectIssue: (issue: CivicIssue) => void
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => Promise<void>
  isUpdatingId: string | null
}

const COLUMNS: { status: IssueStatus; title: string; color: string; bgHeader: string }[] = [
  {
    status: 'Pending',
    title: 'Pending Triage',
    color: 'border-t-bark',
    bgHeader: 'bg-bark/5 text-bark',
  },
  {
    status: 'In Progress',
    title: 'In Progress / Dispatched',
    color: 'border-t-pumpkin',
    bgHeader: 'bg-pumpkin/10 text-pumpkin',
  },
  {
    status: 'Resolved',
    title: 'Resolved / Closed (+15 pts)',
    color: 'border-t-fern',
    bgHeader: 'bg-fern/10 text-fern',
  },
]

export function AdminKanbanBoard({
  issues,
  onSelectIssue,
  onUpdateStatus,
  isUpdatingId,
}: AdminKanbanBoardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const columnIssues = issues.filter((i) => i.status === col.status)

        return (
          <div
            key={col.status}
            className={`flex flex-col rounded-3xl border border-bark/10 border-t-4 ${col.color} bg-birch/50 p-4 shadow-xs`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-bark">{col.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.bgHeader}`}>
                  {columnIssues.length}
                </span>
              </div>
            </div>

            {/* Column Cards Container */}
            <div className="mt-2 space-y-3 flex-1 min-h-[300px]">
              {columnIssues.length === 0 ? (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-bark/15 bg-white/60 text-center text-xs text-bark/40">
                  No {col.status.toLowerCase()} issues
                </div>
              ) : (
                columnIssues.map((issue) => {
                  const isUpdating = isUpdatingId === issue.id
                  const isCritical = issue.aiPriority === 'Critical' && issue.status !== 'Resolved'

                  return (
                    <div
                      key={issue.id}
                      className={`group relative flex flex-col rounded-2xl border bg-white p-4.5 shadow-sm transition hover:shadow-md ${
                        isCritical
                          ? 'border-maple/40 ring-1 ring-maple/20'
                          : 'border-bark/10 hover:border-pumpkin/30'
                      }`}
                    >
                      {/* Top bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-bark/50">
                            #{issue.id.slice(0, 6)}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-pumpkin">
                            {issue.category}
                          </span>
                        </div>
                        <PriorityBadge priority={issue.aiPriority} />
                      </div>

                      {/* Ward & Landmark */}
                      <h4
                        onClick={() => onSelectIssue(issue)}
                        className="mt-2.5 font-bold text-sm text-bark cursor-pointer group-hover:text-pumpkin transition"
                      >
                        {issue.ward}
                      </h4>
                      <p className="text-xs text-bark/60">{issue.landmark}</p>

                      {/* Description */}
                      <p
                        onClick={() => onSelectIssue(issue)}
                        className="mt-2 line-clamp-2 text-xs leading-relaxed text-bark/75 cursor-pointer"
                      >
                        {issue.description}
                      </p>

                      {/* AI Department badge */}
                      <div className="mt-3 flex items-center justify-between border-t border-bark/10 pt-2.5">
                        <span className="rounded bg-bark/5 px-2 py-0.5 text-[11px] font-medium text-bark/70">
                          {issue.aiDepartment}
                        </span>
                        <time className="text-[11px] text-bark/40">
                          {new Date(issue.createdAt).toLocaleDateString('en-LK', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </div>

                      {/* Transition Action Controls */}
                      <div className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-bark/5">
                        <button
                          type="button"
                          onClick={() => onSelectIssue(issue)}
                          className="text-[11px] font-semibold text-bark/60 hover:text-bark transition"
                        >
                          Details
                        </button>

                        <div className="flex items-center gap-1.5">
                          {issue.status === 'Pending' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(issue.id, 'In Progress')}
                              className="rounded-lg bg-pumpkin/10 px-2.5 py-1 text-xs font-semibold text-pumpkin hover:bg-pumpkin hover:text-birch transition disabled:opacity-50"
                            >
                              Dispatch →
                            </button>
                          )}

                          {issue.status === 'In Progress' && (
                            <>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => onUpdateStatus(issue.id, 'Pending')}
                                className="rounded-lg border border-bark/15 px-2 py-1 text-xs font-medium text-bark/60 hover:bg-bark/5 transition"
                                title="Revert to Pending"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => onUpdateStatus(issue.id, 'Resolved')}
                                className="rounded-lg bg-fern px-2.5 py-1 text-xs font-semibold text-birch shadow-xs hover:bg-fern/90 transition disabled:opacity-50"
                              >
                                Resolve ✓
                              </button>
                            </>
                          )}

                          {issue.status === 'Resolved' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(issue.id, 'In Progress')}
                              className="rounded-lg border border-bark/15 px-2.5 py-1 text-xs font-medium text-bark/60 hover:bg-bark/5 transition"
                            >
                              Reopen ↺
                            </button>
                          )}
                        </div>
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
