import { Link } from 'react-router-dom'

const PLATFORM_LINKS = [
  { to: '/feed', label: 'Reported Issues' },
  { to: '/report', label: 'Report an Issue' },
  { to: '/my-reports', label: 'My Reports' },
  { to: '/councils', label: 'Council Directory' },
]

const GOVERNANCE_LINKS = [
  { to: '/councils', label: 'How the system works' },
  { to: '/officer', label: 'Municipal and Provincial Officer Login' },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-bark/10 bg-white py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/resolve-lk-logo.png" alt="Resolve LK" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight text-bark">
                Resolve <span className="text-pumpkin">LK</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-bark/60">
              A civic issue reporting and resolution platform for Sri Lankan Municipal Councils,
              built against the real local government hierarchy of council, province, and ministry
              oversight.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-bark">Platform</h3>
            <ul className="mt-4 space-y-3">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-bark/60 transition hover:text-pumpkin">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-bark">Governance</h3>
            <ul className="mt-4 space-y-3">
              {GOVERNANCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-bark/60 transition hover:text-pumpkin">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-bark/10 pt-6 sm:flex-row">
          <p className="text-xs text-bark/45">
            &copy; {new Date().getFullYear()} Resolve LK. A public civic reporting platform for Sri
            Lankan local government.
          </p>
          <p className="text-xs text-bark/45">Reporting and browsing require no account.</p>
        </div>
      </div>
    </footer>
  )
}
