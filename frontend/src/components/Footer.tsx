export function Footer() {
  return (
    <footer className="border-t border-bark/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/resolve-lk-logo.png" alt="" className="h-7 w-7" />
            <span className="font-bold text-bark">
              Resolve <span className="text-pumpkin">LK</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-bark/60">
            <a href="#problem" className="hover:text-bark">The Problem</a>
            <a href="#feed" className="hover:text-bark">Reported Issues</a>
            <a href="#report" className="hover:text-bark">Report an Issue</a>
          </div>
        </div>
        <p className="mt-8 text-xs text-bark/40">
          Resolve LK — SE3090 Mini Hackathon, SLIIT · Built for Sri Lanka
        </p>
      </div>
    </footer>
  )
}
