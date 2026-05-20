import type { LucideIcon } from 'lucide-react'
import {
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
  { to: '/', label: 'Today', commandLabel: 'Today price desk', group: 'Primary', icon: LayoutGrid, end: true },
  { to: '/prices', label: 'Prices', commandLabel: 'Search food prices', group: 'Primary', icon: Search, end: false },
  { to: '/compare', label: 'Compare', commandLabel: 'Compare districts and sources', group: 'Primary', icon: Scale, end: false },
  { to: '/intelligence', label: 'Trends', commandLabel: 'Historical price trends', group: 'Primary', icon: History, end: false },
  { to: '/watchlists', label: 'Saved', commandLabel: 'Saved watchlists and alerts', group: 'Primary', icon: Bookmark, end: false },
] as const satisfies readonly NavigationItem[]

export const secondaryNavItems = [
  { to: '/basket', label: 'Basket', commandLabel: 'Basket cost workspace', group: 'Tools', icon: ShoppingBasket, end: false },
  { to: '/pipeline', label: 'Sources', commandLabel: 'Source health and refresh history', group: 'Reference', icon: DatabaseZap, end: false },
  { to: '/methods', label: 'Methods', commandLabel: 'Methods and trust', group: 'Reference', icon: BookOpenText, end: false },
  { to: '/developers', label: 'API', commandLabel: 'FoodLK API reference', group: 'Reference', icon: Code2, end: false },
] as const satisfies readonly NavigationItem[]

export const legalNavItems = [
  { to: '/privacy', label: 'Privacy', commandLabel: 'Privacy policy', group: 'Legal', icon: ShieldCheck, end: false },
  { to: '/terms', label: 'Terms', commandLabel: 'Terms of use', group: 'Legal', icon: FileText, end: false },
] as const satisfies readonly NavigationItem[]

export const mastheadNavGroups = [
  { label: 'Primary', items: primaryNavItems },
] as const

export const drawerNavGroups = [
  { label: 'Primary', items: primaryNavItems },
  { label: 'Secondary', items: secondaryNavItems },
] as const

export const commandDestinations: NavigationItem[] = [
  ...primaryNavItems.map((item) => ({ ...item })),
  ...secondaryNavItems.map((item) => ({ ...item })),
  ...legalNavItems.map((item) => ({ ...item })),
]

export const footerSections: Record<string, NavigationItem[]> = {
  Primary: primaryNavItems.map((item) => ({ ...item })),
  Reference: secondaryNavItems.map((item) => ({ ...item })),
  Colophon: legalNavItems.map((item) => ({ ...item })),
}

export const notFoundRecoveryLinks = [
  primaryNavItems[1],
  primaryNavItems[2],
  primaryNavItems[3],
  primaryNavItems[4],
] as const
