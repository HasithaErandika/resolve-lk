const LINKS = [
  { href: '#problem', label: 'The Problem' },
  { href: '#feed', label: 'Reported Issues' },
  { href: '#report', label: 'Report an Issue' },
]

interface HeaderProps {
  onNavigateAdmin?: () => void
}

export function Header({ onNavigateAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-birch/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/resolve-lk-logo.png" alt="" className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-bark">
            Resolve <span className="text-pumpkin">LK</span>
          </span>
        </a>

        <nav className="flex items-center gap-4 sm:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {LINKS.slice(0, 2).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-bark/70 hover:text-bark transition"
              >
                {link.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={onNavigateAdmin}
            className="flex items-center gap-1.5 rounded-lg border border-bark/15 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-bark hover:border-pumpkin hover:text-pumpkin transition"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-pumpkin" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Admin Portal
          </button>

          <a
            href="#report"
            className="rounded-lg bg-pumpkin px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90"
          >
            Report Issue
          </a>
        </nav>
      </div>
    </header>
  )
}

