import { SectionHeader } from '../components/ui/section-header'

export function PrivacyPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Privacy"
        title="Privacy"
        description="This first public privacy surface explains what the food platform stores today and what remains local to the browser."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Browser-local watchlists</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Watchlists currently live in local browser storage. They are not synced to a server or shared across devices.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Public market and retail data</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Product pages display aggregated public pricing signals and source links. The platform is designed around market transparency, not private household data collection.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Operational telemetry</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Deployment and platform tooling may record standard logs for reliability, build diagnostics, and abuse prevention.
          </p>
        </article>
      </div>
    </section>
  )
}
