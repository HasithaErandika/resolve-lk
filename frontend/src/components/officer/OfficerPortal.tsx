import { useOfficerAuth } from '../../context/useOfficerAuth'
import { OfficerLogin } from './OfficerLogin'
import { MunicipalOfficerDashboard } from './MunicipalOfficerDashboard'
import { ProvincialOfficerDashboard } from './ProvincialOfficerDashboard'

export function OfficerPortal({ onBackToPublic }: { onBackToPublic: () => void }) {
  const { user, isLoading } = useOfficerAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-birch">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-bark/60">Checking authorization</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <OfficerLogin onBackToPublic={onBackToPublic} />
  }

  if (user.role === 'provincial_officer') {
    return <ProvincialOfficerDashboard onBackToPublic={onBackToPublic} />
  }

  if (user.role === 'municipal_officer') {
    return <MunicipalOfficerDashboard onBackToPublic={onBackToPublic} />
  }

  // system_admin: a small internal function, not a full dashboard.
  // See docs/srs/03-governance-and-roles.md.
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 bg-birch px-4 text-center">
      <h1 className="text-xl font-bold text-bark">System Administrator</h1>
      <p className="max-w-md text-sm text-bark/60">
        This account provisions Provincial Officer accounts, one per province, via{' '}
        <code className="rounded bg-bark/10 px-1.5 py-0.5 text-xs">POST /api/admin/provincial-officers</code>. There is
        no dedicated console UI for this in v1, since it is a small, internal, rarely used function.
      </p>
      <button
        type="button"
        onClick={onBackToPublic}
        className="mt-2 rounded-lg border border-bark/15 px-4 py-2 text-sm font-semibold text-bark hover:bg-bark/5"
      >
        Back to public site
      </button>
    </div>
  )
}
