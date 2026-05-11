import { useQuery } from '@tanstack/react-query'

import { LoadingBlock } from '../components/ui/loading-block'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'

export function PipelinePage() {
  const pipelineQuery = useQuery({ queryKey: ['pipeline', 'page'], queryFn: api.getPipeline })

  if (pipelineQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Operations"
        title="Pipeline"
        description="Operational transparency remains part of the product, but it now sits inside the broader premium platform."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {pipelineQuery.data?.items.map((item) => <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />)}
      </div>
    </section>
  )
}
