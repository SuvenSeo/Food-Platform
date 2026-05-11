import { useQuery } from '@tanstack/react-query'

import { OfferCard } from '../components/ui/offer-card'
import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'

export function RetailPage() {
  const offersQuery = useQuery({
    queryKey: ['offers', 'retail-page'],
    queryFn: () => api.getOffers('?limit=12'),
  })

  if (offersQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Retail"
        title="Supermarket and grocery intelligence"
        description="Browse normalized offers with a stronger retail framing instead of a generic explore page."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {offersQuery.data?.items.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
      </div>
    </section>
  )
}
