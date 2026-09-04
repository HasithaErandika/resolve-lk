import { type CivicIssue, type IssueStatus } from '../../types/issue'
import { PriorityBadge } from '../Badge'

interface AdminIssueTableProps {
  issues: CivicIssue[]
  onSelectIssue: (issue: CivicIssue) => void
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => Promise<void>
  isUpdatingId: string | null
}

export function AdminIssueTable({
  issues,
  onSelectIssue,
  onUpdateStatus,
  isUpdatingId,
}: AdminIssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-bark/20 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bark/5 text-bark/40">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h3 className="mt-4 text-base font-bold text-bark">No issues found</h3>
        <p className="mt-1 text-xs text-bark/60">
          Try adjusting your search terms, category, or status filters.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-bark/10 bg-white shadow-sm shadow-bark/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-bark">
          <thead className="border-b border-bark/10 bg-birch/40 text-xs font-bold uppercase tracking-wider text-bark/60">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3">
                ID / Date
              </th>
              <th scope="col" className="px-3 py-3.5">
                Priority
              </th>
              <th scope="col" className="px-3 py-3.5">
                Category &amp; Ward
              </th>
              <th scope="col" className="px-3 py-3.5 min-w-[220px]">
                Description
              </th>
              <th scope="col" className="px-3 py-3.5">
                AI Triage
              </th>
              <th scope="col" className="px-3 py-3.5">
                Status Action
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                Action
              </th>
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

              return (
                <tr
                  key={issue.id}
                  className={`transition hover:bg-pumpkin/[0.02] ${
                    issue.aiPriority === 'Critical' && issue.status !== 'Resolved'
                      ? 'bg-maple/[0.02]'
                      : ''
                  }`}
                >
                  {/* ID & Date */}
                  <td className="py-4 pl-6 pr-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-bark">
                        #{issue.id.slice(0, 6)}
                      </span>
                      <time className="mt-0.5 text-xs text-bark/50">{formattedDate}</time>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-4">
                    <PriorityBadge priority={issue.aiPriority} />
                  </td>

                  {/* Category & Ward */}
                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-pumpkin">
                          {issue.category}
                        </span>
                      </div>
                      <span className="mt-0.5 text-xs font-bold text-bark">{issue.ward}</span>
                      <span className="text-xs text-bark/50 truncate max-w-[140px]">
                        {issue.landmark}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-3 py-4">
                    <p className="line-clamp-2 text-xs text-bark/80 leading-relaxed">
                      {issue.description}
                    </p>
                    {issue.photoUrl && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-pumpkin">
                        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.22a.75.75 0 00-1.06 0l-1.91 1.91-4.72-4.72a.75.75 0 00-1.06 0L2.5 11.06zm12-4.81a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Photo attached
                      </span>
                    )}
                  </td>

                  {/* AI Triage */}
                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 rounded-md bg-bark/5 px-2 py-0.5 text-xs font-semibold text-bark/80">
                        {issue.aiDepartment}
                      </span>
                      <span
                        className="mt-1 text-[11px] text-bark/60 line-clamp-1 max-w-[180px]"
                        title={issue.aiReason}
                      >
                        {issue.aiReason}
                      </span>
                    </div>
                  </td>

                  {/* Inline Status Dropdown */}
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={issue.status}
                        disabled={isUpdating}
                        onChange={(e) =>
                          onUpdateStatus(issue.id, e.target.value as IssueStatus)
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition ${
                          issue.status === 'Resolved'
                            ? 'border-fern/30 bg-fern/10 text-fern focus:ring-fern/20'
                            : issue.status === 'In Progress'
                            ? 'border-pumpkin/30 bg-pumpkin/10 text-pumpkin focus:ring-pumpkin/20'
                            : 'border-bark/20 bg-bark/5 text-bark focus:ring-bark/20'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved (+15 pts)</option>
                      </select>
                      {isUpdating && (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-pumpkin border-t-transparent" />
                      )}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-4 pl-3 pr-6 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectIssue(issue)}
                      className="rounded-lg border border-bark/15 bg-white px-3 py-1.5 text-xs font-semibold text-bark transition hover:border-pumpkin hover:text-pumpkin"
                    >
                      Details
                    </button>
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
