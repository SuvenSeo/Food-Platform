import { SectionHeader } from '../components/ui/section-header'

const methodCards = [
  {
    title: 'Normalization',
    body: 'Retail offers are cleaned into comparable names, units, and price-per-unit fields before they appear in public views.',
  },
  {
    title: 'Fair-price logic',
    body: 'The fair-price layer compares an offer against its normalized cluster median so bargains and premium listings are signposted clearly.',
  },
  {
    title: 'Coverage and limitations',
    body: 'Retail data and wet-market quotes come from different collection paths, so freshness and comparison coverage are explained inline rather than hidden.',
  },
]

export function MethodsPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Trust"
        title="Methods"
        description="A premium public product needs to explain how its numbers are produced, not just display them."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {methodCards.map((card) => (
          <article key={card.title} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
            <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
