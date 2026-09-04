import { ReportForm } from '../components/ReportForm'

export function Report() {
  return (
    <section className="py-16">
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
  )
}
