const LINKS = [
  { href: '#problem', label: 'The Problem' },
  { href: '#feed', label: 'Reported Issues' },
  { href: '#report', label: 'Report an Issue' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-birch/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/resolve-lk-logo.png" alt="" className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-bark">
            Resolve <span className="text-pumpkin">LK</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.slice(0, 2).map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-bark/70 hover:text-bark">
              {link.label}
            </a>
          ))}
          <a
            href="#report"
            className="rounded-lg bg-pumpkin px-4 py-2 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90"
          >
            Report an Issue
          </a>
        </nav>
      </div>
    </header>
  )
}
