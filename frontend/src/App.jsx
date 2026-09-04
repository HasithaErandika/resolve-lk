const CATEGORIES = ['Garbage', 'Road', 'Water', 'Lighting']

const SAMPLE_ISSUES = [
  {
    category: 'Garbage',
    ward: 'Colombo 06',
    landmark: 'Near Wellawatte market',
    status: 'Pending',
    priority: 'Critical',
  },
  {
    category: 'Road',
    ward: 'Nugegoda',
    landmark: 'Opposite the bus stand',
    status: 'In Progress',
    priority: 'Medium',
  },
  {
    category: 'Water',
    ward: 'Dehiwala',
    landmark: 'Near the railway crossing',
    status: 'Resolved',
    priority: 'Critical',
  },
]

const PRIORITY_STYLES = {
  Critical: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
}

const STATUS_STYLES = {
  Pending: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">
            Resolve <span className="text-emerald-600">LK</span>
          </span>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <a href="#report" className="hover:text-slate-900">Report an Issue</a>
            <a href="#feed" className="hover:text-slate-900">Browse Issues</a>
            <a href="#" className="hover:text-slate-900">My Reports</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Built for Sri Lanka
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Report a civic issue in your neighbourhood — no account needed.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Garbage dumping, potholes, broken streetlights, burst pipes, blocked drains —
            residents across Sri Lanka have no reliable way to report these to their local
            council, and no visibility once they do. Resolve LK gives every report a public,
            tracked home, triaged automatically by AI so urgent issues, like standing water
            near a school, don&apos;t wait behind routine ones.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#report"
              className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Report an Issue
            </a>
            <a
              href="#feed"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Reported Issues
            </a>
          </div>
        </section>

        {/* Public feed (placeholder — wired to GET /api/issues/public later) */}
        <section id="feed" className="border-t border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Recently reported</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Open to everyone — no login required to browse.
                </p>
              </div>
              <div className="hidden gap-2 sm:flex">
                {CATEGORIES.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_ISSUES.map((issue, index) => (
                <article
                  key={index}
                  className="rounded-xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {issue.category}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900">{issue.ward}</h3>
                  <p className="mt-1 text-sm text-slate-600">{issue.landmark}</p>
                  <span className={`mt-4 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[issue.status]}`}>
                    {issue.status}
                  </span>
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Sample data shown — replace with a live call to GET /api/issues/public.
            </p>
          </div>
        </section>

        {/* Report form (placeholder — wired to POST /api/issues later) */}
        <section id="report" className="border-t border-slate-200 py-14">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Report an issue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Your NIC identifies your report — first time reporting? An account is created
              for you automatically, no separate sign-up.
            </p>

            <form className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="nic" className="block text-sm font-medium text-slate-700">
                    NIC number
                  </label>
                  <input
                    id="nic"
                    name="nic"
                    type="text"
                    placeholder="200112345678"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ward" className="block text-sm font-medium text-slate-700">
                    Ward / Zone
                  </label>
                  <input
                    id="ward"
                    name="ward"
                    type="text"
                    placeholder="e.g. Colombo 03"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="landmark" className="block text-sm font-medium text-slate-700">
                  Nearest landmark
                </label>
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  placeholder="e.g. Opposite the bus stand"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="At least 20 characters — the more detail, the faster it can be triaged."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-slate-700">
                  Photo (optional)
                </label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="mt-1 w-full text-sm text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled
                title="Wired up once the backend is connected"
                className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit report
              </button>
              <p className="text-center text-xs text-slate-400">
                Not yet wired to POST /api/issues — form UI only.
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        Resolve LK — SE3090 Mini Hackathon, SLIIT · Built for Sri Lanka
      </footer>
    </div>
  )
}

export default App
