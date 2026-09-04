import type { CivicIssue } from '../types/issue'
import { PriorityBadge, StatusBadge } from './Badge'

interface IssueDetailModalProps {
  issue: CivicIssue
  onClose: () => void
}

export function IssueDetailModal({ issue, onClose }: IssueDetailModalProps) {
  const formattedDate = new Date(issue.createdAt).toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-bark/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-3xl border border-bark/10 bg-white p-6 sm:p-8 shadow-2xl shadow-bark/20 z-10 my-8">
        <div className="flex items-start justify-between gap-4 border-b border-bark/10 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-bark/10 px-2 py-0.5 font-mono text-xs font-bold text-bark">
                #{issue.id.slice(0, 8)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-pumpkin">
                {issue.category}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.aiPriority} />
            </div>
            <h2 className="mt-2 text-xl font-bold text-bark sm:text-2xl">
              {issue.ward}, {issue.landmark}
            </h2>
            <p className="mt-0.5 text-xs text-bark/50">Reported on {formattedDate}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-bark/40 hover:bg-bark/5 hover:text-bark transition"
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          {issue.photoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-bark/10 bg-bark/5">
              <img
                src={issue.photoUrl}
                alt={`Photo for ${issue.ward}`}
                className="h-64 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-bark/15 bg-birch p-4 text-xs text-bark/60">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-bark/40 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>No field photo was attached with this report.</span>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-bark/50">Description</h3>
            <p className="mt-2 text-sm leading-relaxed text-bark/80 bg-birch p-4 rounded-xl border border-bark/5">
              {issue.description}
            </p>
          </div>

          <div
            className={`rounded-2xl p-5 border ${
              issue.aiPriority === 'Critical'
                ? 'bg-maple/5 border-maple/20'
                : issue.aiPriority === 'Medium'
                ? 'bg-golden/5 border-golden/25'
                : 'bg-bark/5 border-bark/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pumpkin/15 text-pumpkin text-xs font-bold">
                  AI
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-bark">
                  Gemini Auto-Triage Assessment
                </h4>
              </div>
              <PriorityBadge priority={issue.aiPriority} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold text-bark/50">Assigned Department</span>
                <p className="mt-0.5 text-sm font-bold text-bark">{issue.aiDepartment}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-bark/50">Priority</span>
                <p
                  className={`mt-0.5 text-sm font-bold ${
                    issue.aiPriority === 'Critical' ? 'text-maple' : 'text-bark'
                  }`}
                >
                  {issue.aiPriority}
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-bark/10 pt-3">
              <span className="text-xs font-semibold text-bark/50">Reasoning</span>
              <p className="mt-1 text-xs leading-relaxed text-bark/75">{issue.aiReason}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-bark/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-bark/15 bg-white px-5 py-2.5 text-xs font-semibold text-bark hover:bg-bark/5 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
