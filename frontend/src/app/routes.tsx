import { Route, Routes } from 'react-router-dom'

import { AppShell } from '../components/layout/app-shell'
import { BasketPage } from '../pages/basket-page'
import { CategoriesPage } from '../pages/categories-page'
import { ComparePage } from '../pages/compare-page'
import { HomePage } from '../pages/home-page'
import { IntelligencePage } from '../pages/intelligence-page'
import { MarketsPage } from '../pages/markets-page'
import { MethodsPage } from '../pages/methods-page'
import { OfferDetailPage } from '../pages/offer-detail-page'
import { PipelinePage } from '../pages/pipeline-page'
import { RetailPage } from '../pages/retail-page'
import { WatchlistsPage } from '../pages/watchlists-page'

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/intelligence" element={<IntelligencePage />} />
        <Route path="/retail" element={<RetailPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/basket" element={<BasketPage />} />
        <Route path="/watchlists" element={<WatchlistsPage />} />
        <Route path="/methods" element={<MethodsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/offers/:offerId" element={<OfferDetailPage />} />
      </Routes>
    </AppShell>
  )
}
