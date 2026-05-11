import { SectionHeader } from '../components/ui/section-header'

const endpointCards = [
  {
    title: 'Market intelligence',
    endpoint: '/api/v1/home/summary',
    body: 'Homepage-ready editorial payload with hero, KPI, and spotlight cards.',
  },
  {
    title: 'Compare districts',
    endpoint: '/api/v1/compare/districts?left=Colombo&right=Kandy',
    body: 'District produce comparison for the public compare workflow.',
  },
  {
    title: 'Basket presets',
    endpoint: '/api/v1/basket/estimate?preset=essentials',
    body: 'Preset-ready household basket totals for embedded utilities and watchlists.',
  },
]

export function DevelopersPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Developers"
        title="Public data and integration surface"
        description="A lightweight public developer surface helps the food platform behave like a real intelligence product, not just a private dashboard."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {endpointCards.map((card) => (
          <article key={card.endpoint} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{card.title}</p>
            <h3 className="mt-3 break-all text-lg font-semibold text-slate-950">{card.endpoint}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
          </article>
        ))}
      </div>

      <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_45px_rgba(201,111,29,0.10)]">
        <h3 className="text-xl font-semibold text-slate-950">Use cases</h3>
        <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
          <li>Build public widgets for price pulse, basket cost, and district comparison.</li>
          <li>Feed future life-platform federation from stable JSON summaries instead of scraping UI pages.</li>
          <li>Support newsroom, civic-tech, or consumer-app integrations with a simple starting surface.</li>
        </ul>
      </div>
    </section>
  )
}
