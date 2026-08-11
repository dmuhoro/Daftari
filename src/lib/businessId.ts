import type { Business } from './db'

/** Canonical in-app business identifier — always prefer local_id over user_id. */
export function businessLocalId(biz: Pick<Business, 'local_id' | 'id'>): string {
  return biz.local_id ?? String(biz.id ?? '')
}

export interface StoreBusinessShape {
  id: string
  local_id?: string
  name: string
  owner_name?: string
  currency: string
  category?: string
  subcategory?: string
  payment_methods?: string[]
  products?: Array<{
    id: string
    name: string
    price: number
    cost_price?: number
    unit?: string
    stock?: number
    low_stock_threshold?: number
    barcode?: string
  }>
}

/** Map Dexie business row → Zustand store business (id = local_id). */
export function mapBusinessToStore(biz: Business): StoreBusinessShape {
  return {
    id: businessLocalId(biz),
    local_id: biz.local_id,
    name: biz.name,
    owner_name: biz.owner_name,
    currency: biz.currency,
    category: biz.category,
    subcategory: biz.subcategory,
    payment_methods: biz.payment_methods ? JSON.parse(biz.payment_methods) : undefined,
    products: biz.products ? JSON.parse(biz.products) : undefined,
  }
}

/** Resolve preferred active business from list; validates id against local_id or legacy user_id id. */
export function resolveActiveBusiness<T extends { id: string; local_id?: string }>(
  businesses: T[],
  preferredId: string | null | undefined
): T | undefined {
  if (businesses.length === 0) return undefined
  if (!preferredId) return businesses[0]
  return (
    businesses.find(b => b.id === preferredId || b.local_id === preferredId) ??
    businesses[0]
  )
}
