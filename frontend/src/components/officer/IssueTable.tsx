import { NEXT_OFFICER_STATUS, type CivicIssue, type IssueStatus } from '../../types/issue'
import { PriorityBadge, EscalatedBadge, RedirectBadge } from '../Badge'

interface IssueTableProps {
  issues: CivicIssue[]
  onSelectIssue: (issue: CivicIssue) => void
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => Promise<void>
  isUpdatingId: string | null
}

export function IssueTable({ issues, onSelectIssue, onUpdateStatus, isUpdatingId }: IssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-bark/20 bg-white p-12 text-center">
        <h3 className="text-base font-bold text-bark">No issues found</h3>
        <p className="mt-1 text-xs text-bark/60">Try adjusting your search terms, category, or status filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-bark/10 bg-white shadow-sm shadow-bark/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-bark">
          <thead className="border-b border-bark/10 bg-birch/40 text-xs font-bold uppercase tracking-wider text-bark/60">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3">ID / Date</th>
              <th scope="col" className="px-3 py-3.5">Priority</th>
              <th scope="col" className="px-3 py-3.5">Category &amp; Ward</th>
              <th scope="col" className="px-3 py-3.5 min-w-[220px]">Description</th>
              <th scope="col" className="px-3 py-3.5">Status</th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bark/5">
            {issues.map((issue) => {
              const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-LK', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              const isUpdating = isUpdatingId === issue.id
              const nextStatus = NEXT_OFFICER_STATUS[issue.status]

              return (
                <tr
                  key={issue.id}
                  className={`transition hover:bg-pumpkin/[0.02] ${issue.escalated ? 'bg-maple/[0.03]' : ''}`}
                >
                  <td className="py-4 pl-6 pr-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-bark">#{issue.id.slice(0, 6)}</span>
                      <time className="mt-0.5 text-xs text-bark/50">{formattedDate}</time>
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1">
                      <PriorityBadge priority={issue.aiPriority} />
                      {issue.escalated && <EscalatedBadge />}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-pumpkin">{issue.category}</span>
                      <span className="mt-0.5 text-xs font-bold text-bark">{issue.ward}</span>
                      <span className="text-xs text-bark/50 truncate max-w-[140px]">{issue.landmark}</span>
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <p className="line-clamp-2 text-xs text-bark/80 leading-relaxed">{issue.description}</p>
                    {issue.aiJurisdiction === 'redirect' && (
                      <div className="mt-1">
                        <RedirectBadge authority={issue.aiRedirectAuthority} />
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-4">
                    <span className="rounded-lg border border-bark/20 bg-bark/5 px-2.5 py-1.5 text-xs font-semibold text-bark">
                      {issue.status}
                    </span>
                  </td>

                  <td className="py-4 pl-3 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {nextStatus && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onUpdateStatus(issue.id, nextStatus)}
                          className="rounded-lg bg-pumpkin px-3 py-1.5 text-xs font-semibold text-birch hover:bg-pumpkin/90 disabled:opacity-50"
                        >
                          {isUpdating ? 'Saving' : `Move to ${nextStatus}`}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectIssue(issue)}
                        className="rounded-lg border border-bark/15 bg-white px-3 py-1.5 text-xs font-semibold text-bark transition hover:border-pumpkin hover:text-pumpkin"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
