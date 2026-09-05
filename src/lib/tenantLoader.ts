import { getTransactionsForUser, getBusinessesForUser } from './repository'
import { useStore } from './store'
import { mapBusinessToStore, resolveActiveBusiness } from './businessId'

/**
 * Single source of truth for "load this user's tenant data into the store".
 * Used by App.tsx on session start AND by the realtime live-update hook when
 * a remote change arrives — so both paths resolve businesses/transactions,
 * the active business, and the per-user business preference identically.
 */
export async function loadTenantState(userId: string): Promise<void> {
  const [txResult, bizResult] = await Promise.all([
    getTransactionsForUser(userId),
    getBusinessesForUser(userId),
  ])

  if (txResult.ok) useStore.getState().setTransactions(txResult.value)

  const mapped = (bizResult.ok ? bizResult.value : []).map(mapBusinessToStore)
  useStore.getState().setBusinesses(mapped)

  const preferredId = useStore.getState().getPreferredBusinessId(userId)
  const target = resolveActiveBusiness(mapped, preferredId)
  if (target) {
    useStore.getState().setBusiness(target)
    useStore.getState().setActiveBusinessId(target.id, userId)
  } else {
    useStore.getState().setBusiness(null)
    useStore.getState().setActiveBusinessId(null)
  }
}