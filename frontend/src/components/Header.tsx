import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/feed', label: 'Reported Issues' },
  { to: '/councils', label: 'Council Directory' },
  { to: '/my-reports', label: 'My Reports' },
]

function navLinkClass(isActive: boolean) {
  return `text-sm font-medium transition ${isActive ? 'text-bark' : 'text-bark/65 hover:text-bark'}`
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setIsMenuOpen(false)}>
          <img src="/resolve-lk-logo.png" alt="Resolve LK" className="h-9 w-9" />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-bark">
              Resolve <span className="text-pumpkin">LK</span>
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-wide text-bark/45 sm:block">
              Civic Issue Reporting Platform
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => navLinkClass(isActive)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/officer"
            className="rounded-lg border border-bark/15 bg-white px-3.5 py-1.5 text-sm font-semibold text-bark transition hover:border-bark/30"
          >
            Officer Login
          </Link>
          <Link
            to="/report"
            className="rounded-lg bg-pumpkin px-4 py-1.5 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90"
          >
            Report an Issue
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-bark/15 text-bark md:hidden"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-bark/10 bg-white px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-bark/5 text-bark' : 'text-bark/70 hover:bg-bark/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-bark/10 pt-3">
            <Link
              to="/officer"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg border border-bark/15 bg-white px-4 py-2.5 text-center text-sm font-semibold text-bark"
            >
              Officer Login
            </Link>
            <Link
              to="/report"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg bg-pumpkin px-4 py-2.5 text-center text-sm font-semibold text-birch"
            >
              Report an Issue
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
