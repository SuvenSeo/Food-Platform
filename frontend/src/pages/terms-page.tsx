import { SectionHeader } from '../components/ui/section-header'

export function TermsPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Terms"
        title="Terms"
        description="A simple public terms surface clarifies how these signals should be used while the platform continues to expand."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Informational use</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Prices, comparisons, and basket estimates are informational signals built from normalized public data. They are not guarantees of availability or final transaction prices.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Attribution and source links</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Source names and outbound links remain part of the product so users can inspect original retailer or market context alongside the normalized view.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Platform evolution</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Features, coverage, and federation surfaces may change as the food platform matures and connects into broader life-platform workflows.
          </p>
        </article>
      </div>
    </section>
  )
}
