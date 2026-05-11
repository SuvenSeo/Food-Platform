import { SectionHeader } from '../components/ui/section-header'

const categories = [
  'Vegetables',
  'Rice',
  'Dairy',
  'Beverages',
  'Snacks',
  'Pantry staples',
]

export function CategoriesPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Categories"
        title="Category intelligence"
        description="Phase A introduces the landing structure for future category-specific dashboards."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {categories.map((category) => (
          <article key={category} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Category</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{category}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This page family will grow into deep category-level price signals, rankings, and comparisons.
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
