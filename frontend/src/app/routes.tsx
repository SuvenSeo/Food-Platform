import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { AppShell } from '../components/layout/app-shell'
import { LoadingBlock } from '../components/ui/loading-block'

const HomePage = lazy(() => import('../pages/home-page').then((module) => ({ default: module.HomePage })))
const IntelligencePage = lazy(() => import('../pages/intelligence-page').then((module) => ({ default: module.IntelligencePage })))
const RetailPage = lazy(() => import('../pages/retail-page').then((module) => ({ default: module.RetailPage })))
const MarketsPage = lazy(() => import('../pages/markets-page').then((module) => ({ default: module.MarketsPage })))
const CategoriesPage = lazy(() => import('../pages/categories-page').then((module) => ({ default: module.CategoriesPage })))
const ComparePage = lazy(() => import('../pages/compare-page').then((module) => ({ default: module.ComparePage })))
const BasketPage = lazy(() => import('../pages/basket-page').then((module) => ({ default: module.BasketPage })))
const WatchlistsPage = lazy(() => import('../pages/watchlists-page').then((module) => ({ default: module.WatchlistsPage })))
const MethodsPage = lazy(() => import('../pages/methods-page').then((module) => ({ default: module.MethodsPage })))
const DevelopersPage = lazy(() => import('../pages/developers-page').then((module) => ({ default: module.DevelopersPage })))
const PrivacyPage = lazy(() => import('../pages/privacy-page').then((module) => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => import('../pages/terms-page').then((module) => ({ default: module.TermsPage })))
const PipelinePage = lazy(() => import('../pages/pipeline-page').then((module) => ({ default: module.PipelinePage })))
const OfferDetailPage = lazy(() => import('../pages/offer-detail-page').then((module) => ({ default: module.OfferDetailPage })))
const ChangesPage = lazy(() => import('../pages/changes-page').then((module) => ({ default: module.ChangesPage })))
const NotFoundPage = lazy(() => import('../pages/not-found-page').then((module) => ({ default: module.NotFoundPage })))

const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'FoodLK | Sri Lanka Food Price Intelligence',
    description: 'Track Sri Lankan grocery and wet-market pricing with richer comparisons, stronger signal design, and practical tools for everyday decisions.',
  },
  '/intelligence': {
    title: 'Intelligence Desk | FoodLK',
    description: 'Track high-signal price rankings, trend snapshots, and source freshness across Sri Lanka.',
  },
  '/retail': {
    title: 'Retail Discovery | FoodLK',
    description: 'Browse normalised supermarket and grocery offers with source-aware filters and transparent pricing.',
  },
  '/markets': {
    title: 'Market Quotes | FoodLK',
    description: 'Discover wet-market quotes by district to compare public market movement with retail shelves.',
  },
  '/categories': {
    title: 'Category Intelligence | FoodLK',
    description: 'Review category-level retail and market coverage to understand where price signals are strongest.',
  },
  '/compare': {
    title: 'Compare Districts | FoodLK',
    description: 'Compare districts and sources to identify where household food costs diverge across Sri Lanka.',
  },
  '/changes': {
    title: 'Price Changes | FoodLK',
    description: 'Recent retail and wet-market price revisions across Sri Lanka.',
  },
  '/basket': {
    title: 'Basket Workspace | FoodLK',
    description: 'Estimate household basket costs from live retail and market signals across preset categories.',
  },
  '/watchlists': {
    title: 'Watchlists | FoodLK',
    description: 'Save and resume basket presets, compare pairs, and offer views for recurring price discovery sessions.',
  },
  '/pipeline': {
    title: 'Data Pipeline | FoodLK',
    description: 'Monitor source health, ingest rates, and job status across all active retail and market data feeds.',
  },
  '/methods': {
    title: 'Methods & Trust | FoodLK',
    description: 'Understand how FoodLK normalises prices, scores confidence, and maintains source freshness.',
  },
  '/developers': {
    title: 'Developers | FoodLK',
    description: 'Integrate FoodLK data into apps, widgets, and newsroom tools via public JSON endpoints.',
  },
  '/privacy': {
    title: 'Privacy | FoodLK',
    description: 'FoodLK privacy policy — what is stored locally, what is public, and operational telemetry limits.',
  },
  '/terms': {
    title: 'Terms | FoodLK',
    description: 'Terms of use for FoodLK — informational pricing data, attribution, and platform evolution.',
  },
}

function applyMeta(name: string, content: string) {
  const selector = `meta[name="${name}"]`
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function RouteMetadata() {
  const location = useLocation()

  useEffect(() => {
    const metadata = routeMetadata[location.pathname] ?? {
      title: 'FoodLK | Sri Lanka Food Price Intelligence',
      description: 'Sri Lanka food platform with balanced discovery and intelligence tooling for trusted pricing signals.',
    }
    document.title = metadata.title
    applyMeta('description', metadata.description)
  }, [location.pathname])

  return null
}

export function AppRoutes() {
  return (
    <AppShell>
      <RouteMetadata />
      <Suspense fallback={<LoadingBlock />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/retail" element={<RetailPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/changes" element={<ChangesPage />} />
          <Route path="/basket" element={<BasketPage />} />
          <Route path="/watchlists" element={<WatchlistsPage />} />
          <Route path="/methods" element={<MethodsPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/offers/:offerId" element={<OfferDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
