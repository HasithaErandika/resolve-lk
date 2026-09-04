import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/feed', label: 'Reported Issues' },
  { to: '/my-reports', label: 'My Reports' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-birch/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/resolve-lk-logo.png" alt="" className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-bark">
            Resolve <span className="text-pumpkin">LK</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-bark/70 hover:text-bark">
              {link.label}
            </Link>
          ))}
          <Link
            to="/report"
            className="rounded-lg bg-pumpkin px-4 py-2 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90"
          >
            Report an Issue
          </Link>
        </nav>
      </div>
    </header>
  )
}
