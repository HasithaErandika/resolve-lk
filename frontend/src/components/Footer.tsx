import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-bark/10 bg-white mt-auto py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/resolve-lk-logo.png" alt="" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight text-bark">
                Resolve <span className="text-pumpkin">LK</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-bark/60">
              A transparent, AI-triaged civic reporting platform built for Sri Lanka.
              Empowering citizens to fix their neighborhoods without the red tape.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-bark uppercase">Platform</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/feed" className="text-sm text-bark/60 transition hover:text-pumpkin">Reported Issues</Link>
              </li>
              <li>
                <Link to="/report" className="text-sm text-bark/60 transition hover:text-pumpkin">Report an Issue</Link>
              </li>
              <li>
                <Link to="/my-reports" className="text-sm text-bark/60 transition hover:text-pumpkin">My Reports</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-bark uppercase">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#" className="text-sm text-bark/60 transition hover:text-pumpkin">About Us</a>
              </li>
              <li>
                <a href="#" className="text-sm text-bark/60 transition hover:text-pumpkin">Contact Council</a>
              </li>
              <li>
                <a href="#" className="text-sm text-bark/60 transition hover:text-pumpkin">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-bark/10 pt-8 sm:flex-row gap-4">
          <p className="text-xs text-bark/40">
            &copy; {new Date().getFullYear()} Resolve LK. Built for SE3090 Mini Hackathon, SLIIT.
          </p>
          <div className="flex gap-4">
            {/* Social icon placeholders */}
            <a href="#" className="text-bark/30 hover:text-pumpkin transition">
              <span className="sr-only">Facebook</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
            </a>
            <a href="#" className="text-bark/30 hover:text-pumpkin transition">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
