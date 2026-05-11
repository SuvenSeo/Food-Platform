import { SectionHeader } from '../components/ui/section-header'

export function ComparePage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Compare"
        title="Compare stores, districts, and food clusters"
        description="Phase A establishes the comparison workspace so later data surfaces can plug into a consistent side-by-side experience."
      />
      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
        <p className="text-base leading-7 text-slate-600">
          Upcoming compare modules will let users contrast stores, districts, and normalized product clusters with shared URL state and server-side summary payloads.
        </p>
      </div>
    </section>
  )
}
