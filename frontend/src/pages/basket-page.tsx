import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Bookmark, CheckCircle2, CircleDashed, Search } from 'lucide-react'

import { AlertSignup } from '../components/retention/alert-signup'
import { FoodItemImage } from '../components/primitives/food-item-image'
import { Badge } from '../components/ui/badge'
import { RevealSection } from '../components/ui/reveal-section'
import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { WorkflowCue } from '../components/ui/workflow-cue'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

function basketAvailabilityCopy(reason: string | undefined, windowDays: number) {
  if (reason === 'stale_data_hidden') return `Only older quotes were found, so this line is hidden from the ${windowDays}-day quick estimate.`
  if (reason === 'currently_unavailable') return 'Retail item exists, but the latest source marks it unavailable.'
  if (reason === 'no_match_found') return 'No matching current quote or offer is indexed yet.'
  return 'Ready for this estimate.'
}

export function BasketPage() {
  const [preset, setPreset] = useState('essentials')
  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'missing'>('all')
  const [sortBy, setSortBy] = useState<'ledger' | 'price-low' | 'price-high' | 'name'>('ledger')

  const basketQuery = useQuery({
    queryKey: ['basket-estimate', preset],
    queryFn: () => api.getBasketEstimate(preset),
  })
  const { saveEntry } = useWatchlists()
  const data = basketQuery.data
  const presetOptions = data?.available_presets.length ? data.available_presets : [{ id: preset, label: 'Loading preset...' }]
  const freshnessWindowDays = data?.items.find((item) => item.freshness_window_days)?.freshness_window_days ?? 30
  const staleHiddenCount = data?.items.filter((item) => item.availability_reason === 'stale_data_hidden').length ?? 0

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.items ?? [])
      .filter((item) => {
        if (availabilityFilter === 'available') return item.price_lkr !== null
        if (availabilityFilter === 'missing') return item.price_lkr === null
        return true
      })
      .filter((item) => `${item.label} ${item.source || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sortBy === 'ledger') return 0
        if (sortBy === 'name') return a.label.localeCompare(b.label)
        const aPrice = a.price_lkr ?? Infinity
        const bPrice = b.price_lkr ?? Infinity
        return sortBy === 'price-high' ? bPrice - aPrice : aPrice - bPrice
      })
  }, [availabilityFilter, data?.items, search, sortBy])

  const runningRows = useMemo(() => {
    return visibleItems.reduce<Array<(typeof visibleItems)[number] & { runningTotal: number }>>((rows, item) => {
      const previousTotal = rows.at(-1)?.runningTotal ?? 0
      const runningTotal = previousTotal + (item.price_lkr ?? 0)
      return [...rows, { ...item, runningTotal }]
    }, [])
  }, [visibleItems])

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Household estimate"
        title="Cost a basket with visible source limits"
        description="Use the presets as a food-cost model, then inspect missing lines and freshness before treating the total as a decision."
      />

      {basketQuery.isError && (
        <ErrorState
          title="Basket workspace unavailable"
          message="Basket estimates are currently unavailable."
          helper="Continue with retail and compare discovery while basket calculations recover."
          onRetry={() => basketQuery.refetch()}
          links={[
            { label: 'Open prices', to: '/prices' },
            { label: 'Open compare', to: '/compare' },
          ]}
        />
      )}

      <WorkflowCue
        id="basket-ledger-guidance"
        eyebrow="Basket path"
        title="Use presets as a household estimate, then inspect missing lines."
        body={`The basket total uses current retail rows and market quotes from the last ${freshnessWindowDays} days. Missing lines are separated so old archive prices do not make the estimate look artificially cheap.`}
        points={['Pick preset', 'Review missing', 'Clip basket']}
        actionLabel="Compare districts"
        actionTo="/compare"
        secondaryActionLabel="Open prices"
        secondaryActionTo="/prices"
      />

      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="min-w-0 space-y-4">
          <div className="border-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] p-5 shadow-stamp">
            <p className="text-kicker">Basket preset</p>
            <div className="mt-4 grid gap-2">
              {presetOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={[
                    'border px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--chili-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--paper-50)]',
                    preset === item.id
                      ? 'border-[color:var(--color-text-primary)] bg-[color:var(--color-text-primary)] text-[color:var(--paper-50)]'
                      : 'border-[color:var(--color-border-hover)] bg-[color:var(--color-bg-card)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-text-primary)] hover:text-[color:var(--color-text-primary)]',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {data && (
              <button
                type="button"
                onClick={() => saveEntry({
                  id: `basket-${data.preset.id}`,
                  title: data.preset.label ?? 'Basket preset',
                  kind: 'basket',
                  href: `/basket?preset=${data.preset.id}`,
                  summary: `${data.summary.available_items} items · Rs ${formatCurrency(data.summary.total_lkr ?? 0)}`,
                })}
                className="fp-button-primary mt-5 w-full"
              >
                <Bookmark className="h-4 w-4" />
                Clip this basket
              </button>
            )}
          </div>

          {!basketQuery.isLoading && data && (
            <div className="grid gap-[1px] bg-[color:var(--color-border)]">
              {[
                { label: 'Running total', value: `රු ${formatCurrency(data.summary.total_lkr ?? 0)}` },
                { label: 'Quoted lines', value: `${data.summary.available_items}/${data.items.length}` },
                { label: 'Missing lines', value: data.summary.missing_items.toLocaleString() },
                { label: 'Quote window', value: `${freshnessWindowDays} days` },
              ].map((item) => (
                <div key={item.label} className="bg-[color:var(--color-bg-card)] p-4">
                  <p className="text-kicker">{item.label}</p>
                  <p className="num mt-2 text-2xl font-bold text-[color:var(--color-text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {staleHiddenCount > 0 && (
            <div className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 text-sm text-[color:var(--color-text-secondary)]">
              {staleHiddenCount} basket line{staleHiddenCount === 1 ? '' : 's'} had only older market data, so those prices are hidden from the quick total.
            </div>
          )}

          <AlertSignup
            compact
            defaultScope="basket"
            defaultScopeValue={preset}
            title="Watch this basket"
            subtitle="Save the preset as a recurring basket alert. Email delivery may be preview-only until confirmation mail is configured."
          />
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="fp-toolbar md:grid-cols-[1.4fr_0.8fr_0.8fr] lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <label className="space-y-2">
              <span className="eyebrow-label">Search shopping list</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="fp-input pl-10"
                  placeholder="Oil, tomato, rice..."
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="eyebrow-label">Availability</span>
              <select
                value={availabilityFilter}
                onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)}
                className="fp-select"
              >
                <option value="all">All lines</option>
                <option value="available">Quoted only</option>
                <option value="missing">Missing only</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="eyebrow-label">Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="fp-select">
                <option value="ledger">Ledger order</option>
                <option value="price-low">Lowest price</option>
                <option value="price-high">Highest price</option>
                <option value="name">Alphabetical</option>
              </select>
            </label>
          </div>

          <RevealSection>
            {basketQuery.isLoading ? (
              <SectionSkeleton cards={4} />
            ) : !runningRows.length ? (
              <EmptyState
                title="No basket items match this filter"
                description="Try broader filters, switch presets, or continue with adjacent discovery workflows."
                hint="Next action: continue in markets or compare."
                actionLabel="Open markets"
                actionTo="/markets"
                secondaryActionLabel="Open compare"
                secondaryActionTo="/compare"
              />
            ) : (
              <div className="overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)]">
                <div className="hidden grid-cols-[48px_64px_1fr_0.8fr_0.7fr_0.75fr] border-b border-[color:var(--color-text-primary)] bg-[color:var(--color-bg-secondary)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] md:grid">
                  <span>No.</span>
                  <span aria-hidden="true" />
                  <span>Item</span>
                  <span>Source</span>
                  <span className="text-right">Line price</span>
                  <span className="text-right">Running total</span>
                </div>
                {runningRows.map((item, index) => (
                  <article
                    key={`${item.label}-${index}`}
                    className="grid gap-3 border-b border-dotted border-[color:var(--color-border-hover)] px-4 py-4 last:border-b-0 md:grid-cols-[48px_64px_1fr_0.8fr_0.7fr_0.75fr] md:items-center"
                  >
                    <div className="flex items-center gap-2">
                      {item.price_lkr == null ? (
                        <CircleDashed className="h-4 w-4 text-[color:var(--color-text-muted)]" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-[color:var(--curry-leaf)]" aria-hidden="true" />
                      )}
                      <span className="num font-mono text-xs text-[color:var(--color-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <FoodItemImage
                      src={item.image_url}
                      name={item.label}
                      source={item.source}
                      className="h-16 w-16"
                    />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">{item.label}</h3>
                      <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                        {item.price_lkr == null
                          ? basketAvailabilityCopy(item.availability_reason, freshnessWindowDays)
                          : item.kind === 'market_quote'
                            ? `Market quote inside the last ${item.freshness_window_days ?? freshnessWindowDays} days.`
                            : 'Retail offer currently marked available.'}
                      </p>
                      <p className="md:hidden text-xs text-[color:var(--color-text-muted)]">{item.source || 'Source pending'}</p>
                    </div>
                    <p className="hidden truncate font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)] md:block">
                      {item.source || 'Pending'}
                      <span className="block text-[9px] tracking-[0.12em] text-[color:var(--color-text-faint)]">
                        {item.observed_at ? formatCompactDate(item.observed_at) : 'Freshness pending'}
                      </span>
                    </p>
                    <div className="md:text-right">
                      {item.price_lkr == null ? (
                        <Badge variant="neutral">Missing</Badge>
                      ) : (
                        <p className="num font-bold text-[color:var(--color-text-primary)]">රු {formatCurrency(item.price_lkr)}</p>
                      )}
                    </div>
                    <p className="num border-t border-[color:var(--color-border)] pt-2 text-right text-lg font-bold text-[color:var(--chili-600)] md:border-t-0 md:pt-0">
                      රු {formatCurrency(item.runningTotal)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </RevealSection>

          <NextActionLinks
            title="Next actions"
            links={[
              { label: 'Compare districts', to: '/compare' },
              { label: 'Price workspace', to: '/prices' },
              { label: 'Review watchlists', to: '/watchlists' },
            ]}
          />
        </div>
      </div>
    </section>
  )
}
