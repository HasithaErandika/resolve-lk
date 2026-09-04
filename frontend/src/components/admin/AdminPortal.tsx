import { useAdminAuth } from '../../context/useAdminAuth'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'

export function AdminPortal({ onBackToPublic }: { onBackToPublic: () => void }) {
  const { user, isLoading } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-birch">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-pumpkin border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-bark/60">
            Checking municipal authorization…
          </p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <AdminLogin onBackToPublic={onBackToPublic} />
  }

  return <AdminDashboard onBackToPublic={onBackToPublic} />
}
