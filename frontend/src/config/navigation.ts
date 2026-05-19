import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bookmark,
  BookOpenText,
  Code2,
  DatabaseZap,
  FileText,
  History,
  LayoutGrid,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Waves,
} from 'lucide-react'

export type NavigationItem = {
  to: string
  label: string
  commandLabel?: string
  group: string
  icon: LucideIcon
  end: boolean
}

export const primaryNavItems = [
  { to: '/', label: 'Home', commandLabel: 'Today dashboard', group: 'Everyday', icon: LayoutGrid, end: true },
  { to: '/items', label: 'Prices', commandLabel: 'Price catalog', group: 'Everyday', icon: Search, end: false },
  { to: '/compare', label: 'Compare', commandLabel: 'Compare districts and sources', group: 'Everyday', icon: Scale, end: false },
  { to: '/basket', label: 'Basket', commandLabel: 'Basket workspace', group: 'Everyday', icon: ShoppingBasket, end: false },
  { to: '/watchlists', label: 'Saved', commandLabel: 'Saved watchlists', group: 'Everyday', icon: Bookmark, end: false },
] as const satisfies readonly NavigationItem[]

export const dataNavItems = [
  { to: '/markets', label: 'Markets', commandLabel: 'Official market quotes', group: 'Data', icon: Waves, end: false },
  { to: '/retail', label: 'Retail', commandLabel: 'Retail offer board', group: 'Data', icon: Store, end: false },
  { to: '/intelligence', label: 'Insights', commandLabel: 'Intelligence desk', group: 'Data', icon: BarChart3, end: false },
  { to: '/changes', label: 'Changes', commandLabel: 'Recent price changes', group: 'Data', icon: History, end: false },
  { to: '/pipeline', label: 'Pipeline', commandLabel: 'Data pipeline status', group: 'Data', icon: DatabaseZap, end: false },
  { to: '/methods', label: 'Methods', commandLabel: 'Methods and trust', group: 'Data', icon: BookOpenText, end: false },
  { to: '/developers', label: 'API', commandLabel: 'Developers API', group: 'Data', icon: Code2, end: false },
] as const satisfies readonly NavigationItem[]

export const legalNavItems = [
  { to: '/privacy', label: 'Privacy', commandLabel: 'Privacy policy', group: 'Legal', icon: ShieldCheck, end: false },
  { to: '/terms', label: 'Terms', commandLabel: 'Terms of use', group: 'Legal', icon: FileText, end: false },
] as const satisfies readonly NavigationItem[]

export const mastheadNavGroups = [
  { label: 'Everyday', items: primaryNavItems },
] as const

export const drawerNavGroups = [
  { label: 'Everyday', items: primaryNavItems },
  { label: 'Data', items: dataNavItems },
] as const

export const commandDestinations: NavigationItem[] = [
  ...primaryNavItems.map((item) => ({ ...item })),
  ...dataNavItems.map((item) => ({ ...item })),
  ...legalNavItems.map((item) => ({ ...item })),
]

export const footerSections: Record<string, NavigationItem[]> = {
  Everyday: primaryNavItems.map((item) => ({ ...item })),
  Data: dataNavItems.map((item) => ({ ...item })),
  Colophon: legalNavItems.map((item) => ({ ...item })),
}

export const notFoundRecoveryLinks = [
  primaryNavItems[1],
  primaryNavItems[2],
  primaryNavItems[3],
  dataNavItems[0],
] as const
