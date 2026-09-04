import { Link } from 'react-router-dom'

const STEPS = [
  {
    title: 'Report',
    body: 'Describe the issue, drop a photo, and submit. Your NIC and email set up your account automatically, no separate sign-up.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'AI Triage',
    body: 'Gemini reads the report and assigns a priority and department instantly, so urgent issues never sit in a queue unnoticed.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Resolved',
    body: 'Municipal engineers track, assign, and close it out on their dashboard, and you earn contribution points when they do.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
]

const STATS = [
  { label: 'Categories covered', value: '4' },
  { label: 'Time to file', value: '< 2 min' },
  { label: 'Sign-up required', value: 'None' },
]

const PROBLEM_AREAS = [
  ['Garbage', 'Illegal dumping and uncollected waste', 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  ['Roads', 'Potholes and damaged surfaces', 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'],
  ['Water', 'Burst pipes and leaks', 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'],
  ['Lighting', 'Broken or dark streetlights', 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'],
]

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-pumpkin/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pumpkin">
              Built for Sri Lanka
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-bark sm:text-5xl">
              Report a civic issue in your neighbourhood. No account needed.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-bark/70 sm:text-lg">
              Garbage dumping, potholes, broken streetlights, burst pipes, blocked drains.
              Residents across Sri Lanka have no reliable way to report these to their local
              council, and no visibility once they do. Resolve LK gives every report a public,
              tracked home, triaged automatically by AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/report"
                className="rounded-lg bg-pumpkin px-6 py-3 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90 flex items-center gap-2"
              >
                Report an Issue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                to="/feed"
                className="rounded-lg border border-bark/15 bg-white px-6 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
              >
                Browse Reports
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-bark/10 pt-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dd className="text-2xl font-black text-bark">{stat.value}</dd>
                  <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-bark/50">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-pumpkin/10 to-maple/5 blur-2xl"></div>
            <div className="relative rounded-3xl border border-bark/10 bg-white/60 p-6 shadow-xl shadow-bark/5 backdrop-blur-sm sm:p-8">
              <div className="flex items-center gap-3 border-b border-bark/10 pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pumpkin text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-bark/50">Gemini AI</p>
                  <p className="text-sm font-semibold text-bark">Automated Triage Result</p>
                </div>
              </div>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-bark/50 mb-1.5">Original Report</p>
                  <p className="text-sm italic text-bark/80 bg-birch p-3 rounded-xl border border-bark/5">
                    &ldquo;Massive pile of garbage near the school gates, mosquitos are breeding everywhere.&rdquo;
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-maple/5 p-4 ring-1 ring-inset ring-maple/15">
                    <p className="text-xs font-bold uppercase tracking-wider text-maple mb-1">Priority</p>
                    <p className="text-lg font-black text-maple">Critical</p>
                  </div>
                  <div className="rounded-xl bg-golden/5 p-4 ring-1 ring-inset ring-golden/15">
                    <p className="text-xs font-bold uppercase tracking-wider text-golden mb-1">Department</p>
                    <p className="text-sm font-bold text-bark">Public Health</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-bark/50 mb-1.5">AI Reasoning</p>
                  <p className="text-sm text-bark/90">
                    Dengue outbreak risk near a school zone requires immediate clearance and health inspection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem explainer */}
      <section className="border-y border-bark/10 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl text-center mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">
              The Civic Problem
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-bark/70">
              Fixing a civic issue in Sri Lanka usually means physically visiting a council office, writing a letter, and hoping it reaches the right person. There is no tracking or transparency.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEM_AREAS.map(([title, body, path]) => (
              <div key={title} className="group rounded-2xl border border-bark/10 bg-birch/30 p-6 transition hover:bg-white hover:shadow-lg hover:shadow-bark/5">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-bark/10 text-pumpkin group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={path as string} />
                  </svg>
                </span>
                <p className="mt-5 text-lg font-bold text-bark">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-bark/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-bark/10 bg-pumpkin/5 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-bark/70">
              A streamlined, transparent process from reporting to resolution.
            </p>
          </div>
          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                {index !== STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-12 right-0 h-0.5 bg-bark/10" aria-hidden="true"></div>
                )}
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-pumpkin text-birch shadow-lg shadow-pumpkin/20 ring-4 ring-birch">
                  {step.icon}
                </span>
                <h3 className="mt-6 text-xl font-bold text-bark">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-bark/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
