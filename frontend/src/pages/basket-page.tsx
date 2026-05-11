import { SectionHeader } from '../components/ui/section-header'

export function BasketPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Basket"
        title="Basket workspace"
        description="A practical utility layer for household totals, substitutions, and future saved basket workflows."
      />
      <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_45px_rgba(201,111,29,0.10)]">
        <h3 className="text-xl font-semibold text-slate-950">Basket snapshot</h3>
        <p className="mt-3 text-base leading-7 text-slate-700">
          Phase A ships the premium landing surface and messaging here. The next slice will add preset baskets,
          source comparisons, and delta calculations built on normalized offer data.
        </p>
      </div>
    </section>
  )
}
