import { useState, type FormEvent } from 'react'
import { useAdminAuth } from '../../context/useAdminAuth'

export function AdminLogin({ onBackToPublic }: { onBackToPublic: () => void }) {
  const { signIn, isLoading } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter your municipal staff email.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setIsSubmitting(true)
    const result = await signIn(email, password)
    setIsSubmitting(false)

    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Top return link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToPublic}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-bark/60 transition hover:text-pumpkin"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Back to Public Portal
          </button>
          <span className="rounded-full bg-pumpkin/10 px-2.5 py-0.5 text-xs font-semibold text-pumpkin">
            Restricted Access
          </span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-bark/10 bg-white p-8 shadow-xl shadow-bark/5 sm:p-10">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bark text-birch shadow-md shadow-bark/20">
              <img src="/resolve-lk-logo.png" alt="" className="h-9 w-9" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-bark">
              Municipal Console
            </h1>
            <p className="mt-1.5 text-xs text-bark/60">
              Pradeshiya Sabha and Municipal Council Operations
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mt-6 rounded-xl border border-maple/20 bg-maple/10 p-3.5 text-xs text-maple">
              <div className="flex items-start gap-2.5">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-bark/80">
                Staff Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@council.gov.lk"
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-3.5 py-2.5 text-sm text-bark placeholder:text-bark/30 outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-bark/80">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-3.5 py-2.5 text-sm text-bark placeholder:text-bark/30 outline-none transition focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="mt-2 w-full rounded-xl bg-pumpkin py-3 text-sm font-semibold text-birch shadow-md shadow-pumpkin/20 transition hover:bg-pumpkin/90 disabled:opacity-60"
            >
              {isSubmitting ? 'Authenticating…' : 'Sign In as Administrator'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-bark/40">
            Authorized municipal officers only. All actions and status modifications are logged and
            audited.
          </p>
        </div>
      </div>
    </div>
  )
}
