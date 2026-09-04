import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { IssueCard } from './components/IssueCard'
import { ReportForm } from './components/ReportForm'
import { sampleIssues } from './data/sampleIssues'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AdminPortal } from './components/admin/AdminPortal'

const STEPS = [
  {
    title: 'Report',
    body: 'Describe the issue, drop a photo, and submit — your NIC and email set up your account automatically, no separate sign-up.',
  },
  {
    title: 'AI Triage',
    body: 'Gemini reads the report and assigns a priority and department instantly, so urgent issues never sit in a queue unnoticed.',
  },
  {
    title: 'Resolved',
    body: 'Municipal engineers track, assign, and close it out on their dashboard — and you earn contribution points when they do.',
  },
]

const STATS = [
  { label: 'Issue categories covered', value: '4' },
  { label: 'Minutes to file a report', value: '<2' },
  { label: 'Login required to report', value: 'None' },
]

const PROBLEM_AREAS = [
  ['Garbage', 'Illegal dumping and uncollected waste'],
  ['Roads', 'Potholes and damaged surfaces'],
  ['Water', 'Burst pipes and leaks'],
  ['Lighting', 'Broken or dark streetlights'],
]

function AppContent() {
  const [view, setView] = useState<'public' | 'admin'>(() =>
    typeof window !== 'undefined' && window.location.hash.startsWith('#admin')
      ? 'admin'
      : 'public'
  )

  useEffect(() => {
    function handleHash() {
      if (window.location.hash.startsWith('#admin')) {
        setView('admin')
      } else if (window.location.hash === '' || window.location.hash === '#top' || window.location.hash === '#problem' || window.location.hash === '#feed' || window.location.hash === '#report') {
        setView('public')
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  function goToAdmin() {
    window.location.hash = '#admin'
    setView('admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToPublic() {
    window.location.hash = '#top'
    setView('public')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (view === 'admin') {
    return <AdminPortal onBackToPublic={goToPublic} />
  }

  return (
    <div id="top" className="min-h-screen bg-birch text-bark">
      <Header onNavigateAdmin={goToAdmin} />


      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-pumpkin/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pumpkin">
                Built for Sri Lanka
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-bark sm:text-5xl">
                Report a civic issue in your neighbourhood — no account needed.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-bark/70 sm:text-lg">
                Garbage dumping, potholes, broken streetlights, burst pipes, blocked drains —
                residents across Sri Lanka have no reliable way to report these to their local
                council, and no visibility once they do. Resolve LK gives every report a public,
                tracked home, triaged automatically by AI so urgent issues don&apos;t wait behind
                routine ones.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#report"
                  className="rounded-lg bg-pumpkin px-6 py-3 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90"
                >
                  Report an Issue
                </a>
                <a
                  href="#feed"
                  className="rounded-lg border border-bark/15 bg-white px-6 py-3 text-sm font-semibold text-bark transition hover:bg-bark/5"
                >
                  Browse Reported Issues
                </a>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-bark/10 pt-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-xs text-bark/50">{stat.label}</dt>
                    <dd className="mt-1 text-xl font-bold text-bark">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-3xl border border-bark/10 bg-white p-6 shadow-lg shadow-bark/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-bark/40">
                Sample AI triage result
              </p>
              <div className="mt-3 rounded-2xl bg-maple/5 p-5 ring-1 ring-inset ring-maple/15">
                <p className="text-xs font-semibold uppercase tracking-wide text-maple">Critical</p>
                <p className="mt-2 text-sm text-bark">
                  &ldquo;Massive pile of garbage near a school, mosquito breeding ground.&rdquo;
                </p>
                <p className="mt-3 text-xs text-bark/60">
                  <span className="font-semibold text-bark">Department:</span> Public Health
                  <br />
                  <span className="font-semibold text-bark">Reason:</span> Dengue outbreak risk
                  near a school zone requires immediate clearance.
                </p>
              </div>
              <p className="mt-4 text-xs text-bark/40">
                Generated automatically by Gemini for every report — no manual triage needed.
              </p>
            </div>
          </div>
        </section>

        {/* Problem explainer */}
        <section id="problem" className="scroll-mt-16 border-y border-bark/10 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-bark sm:text-3xl">
                The problem
              </h2>
              <p className="mt-4 leading-relaxed text-bark/70">
                Fixing a civic issue in Sri Lanka usually means physically visiting a Pradeshiya
                Sabha or Municipal Council office, writing a letter, and hoping it reaches the
                right person. There&apos;s no reference number, no tracking, and no digital
                record of what&apos;s pending, in progress, or resolved — for either the resident
                or the council.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROBLEM_AREAS.map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-bark/10 p-5">
                  <p className="font-semibold text-bark">{title}</p>
                  <p className="mt-1 text-sm text-bark/60">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-bark sm:text-3xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pumpkin text-sm font-bold text-birch">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-bark">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-bark/60">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live feed preview */}
        <section id="feed" className="scroll-mt-16 border-t border-bark/10 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-bark sm:text-3xl">
                  Recently reported
                </h2>
                <p className="mt-1 text-sm text-bark/60">Open to everyone — no login required.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sampleIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
            <p className="mt-6 text-xs text-bark/40">
              Sample data shown — replace with a live call to GET /api/issues/public.
            </p>
          </div>
        </section>

        {/* Report form */}
        <section id="report" className="scroll-mt-16 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-bark">Report an issue</h2>
              <p className="mt-2 text-bark/60">
                One form does it all — your NIC identifies your report, and if it&apos;s your
                first time, an account is created for you automatically. No separate sign-up.
              </p>
            </div>
            <div className="mt-10">
              <ReportForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  )
}

