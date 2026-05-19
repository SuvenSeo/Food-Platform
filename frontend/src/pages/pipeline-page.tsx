import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { LoadingBlock } from '../components/ui/loading-block'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/api'

export function PipelinePage() {
  const pipelineQuery = useQuery({ queryKey: ['pipeline', 'page'], queryFn: api.getPipeline })

  if (pipelineQuery.isLoading) {
    return <LoadingBlock message="Loading pipeline status..." />
  }

  const items = pipelineQuery.data?.items ?? []
  const summary = pipelineQuery.data?.summary
  const healthy = summary?.healthy_sources ?? items.filter((i) => ['success', 'completed', 'healthy'].includes(i.status.toLowerCase())).length
  const failed = items.filter((i) => ['failed', 'error', 'missing', 'empty', 'stale'].includes(i.status.toLowerCase())).length
  const running = items.filter((i) => i.status.toLowerCase() === 'running').length
  const total = summary?.total_sources ?? items.length
  const warnings = summary?.blocking_warnings ?? []

  const ingestData = items.map((item, idx) => ({
    name: item.source.slice(0, 8),
    seen: item.items_seen,
    stored: item.records_count ?? item.items_stored,
    idx,
  }))

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Source-health newsroom"
        title="Pipeline"
        description="Operational transparency — source health, ingest rates, and job status across all active feeds."
      />

      {/* Health summary */}
      <RevealSection>
        <div className="hairline-grid rounded-lg overflow-hidden grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Expected sources', value: total, variant: 'neutral' as const },
            { label: 'Healthy', value: healthy, variant: 'green' as const },
            { label: 'Needs attention', value: failed, variant: 'red' as const },
            { label: 'Running', value: running, variant: 'orange' as const },
          ].map(({ label, value, variant }) => (
            <div key={label} className="bg-[#0a0a0a] p-5">
              <p className="eyebrow-label">{label}</p>
              <p className="num mt-2 text-3xl font-semibold text-foreground">{value}</p>
              <Badge variant={variant} className="mt-2">{variant}</Badge>
            </div>
          ))}
        </div>
      </RevealSection>

      {warnings.length > 0 && (
        <RevealSection delay={40}>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            <p className="font-semibold text-red-200">Blocking source warnings</p>
            <ul className="mt-2 grid gap-1 text-red-100/85">
              {warnings.slice(0, 6).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </RevealSection>
      )}

      {/* Ingest volume chart */}
      {ingestData.length > 1 && (
        <RevealSection delay={80}>
          <div className="fp-panel space-y-4">
            <p className="eyebrow-label">Ingest volume by source</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ingestData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#f5f5f5', fontSize: 12 }}
                    formatter={(v, name) => [Number(v).toLocaleString(), String(name)]}
                  />
                  <Line type="monotone" dataKey="seen" stroke="#f97316" strokeWidth={2} dot={false} name="Seen" />
                  <Line type="monotone" dataKey="stored" stroke="#34d399" strokeWidth={2} dot={false} name="Stored" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-orange-500" />Seen</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-400" />Stored</span>
            </div>
          </div>
        </RevealSection>
      )}

      {/* Source cards */}
      <RevealSection delay={120}>
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={`${item.source}-${item.finished_at ?? item.status}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <PipelineCard item={item} />
            </motion.div>
          ))}
        </div>
      </RevealSection>
    </section>
  )
}
