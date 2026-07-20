# Sprint v5.2.0 — Architectural Debt

**Release date:** 2026-07-20  
**Version:** `5.2.0`  
**Theme:** Eliminating architectural debt for beta readiness

---

## What was done

### A — Repository Pattern (full migration)
All 17 feature files migrated from direct `import { db }` to repository imports. Only infrastructure files (`repository.ts`, `syncAll.ts`, `syncQueue.ts`, `backup.ts`) still reference Dexie directly.

Repository layer extended to cover all 8 entity types — 45+ functions for transactions, business, sync_queue, daily_closes, customers, suppliers, purchase_orders, stock_adjustments.

### B — Store.ts refactored
`addTransaction`, `updateTransaction`, `deleteTransaction` in Zustand store now call repository functions instead of operating on Dexie directly.

### C — Money safety pass
`cents()` helper (wraps `Math.round()`) applied at all aggregation boundaries across:
- `DashboardScreen.tsx` — daily, weekly, product, fuliza aggregations
- `DailyClose.tsx` — revenue, expenses, profit
- `MonthlyReportScreen.tsx` — monthly totals, day-by-day, category breakdowns
- `PosScreen.tsx` — cart total, discount, final total
- `PurchaseOrdersScreen.tsx` — PO total
- `ProductProfitabilityScreen.tsx` — per-product revenue/cost, totals
- `CustomerDetailScreen.tsx` — total spent
- `SMSParser.tsx` — customer total_spent update

### D — DB schema version correction
`DB.VERSION` in `constants.ts` corrected from `5` to `6` (previously mismatched with actual schema).

### E — Receipt text format fix
Receipt text line count and formatting corrected in `print.ts` after debugging thermal printer output.

---

## Files changed

| File | Change |
|------|--------|
| `CHANGELOG.md` | Added v5.2.0 section |
| `package.json` | 5.1.0 → 5.2.0 |
| `docs/changelog/sprint-v5-2-0-architectural-debt.md` | Created (this file) |
| `src/lib/repository.ts` | Extended with 45+ CRUD + query functions for all 8 entities |
| `src/lib/money.ts` | Added `cents()` helper |
| `src/lib/store.ts` | Refactored to use repository functions |
| `src/lib/constants.ts` | Corrected `DB.VERSION` from 5 to 6 |
| `src/lib/print.ts` | Corrected receipt text format |
| `src/lib/repository.test.ts` | Updated for new signatures |
| `src/features/sync/SyncDot.tsx` | Migrated to repository |
| `src/features/sync/useRecordingStreak.ts` | Migrated to repository |
| `src/features/close/DailyClose.tsx` | Migrated + money safety |
| `src/features/sms/SMSParser.tsx` | Migrated + money safety |
| `src/screens/DashboardScreen.tsx` | Money safety wrappings |
| `src/screens/CustomersScreen.tsx` | Migrated (type-only) |
| `src/screens/CustomerDetailScreen.tsx` | Migrated + money safety |
| `src/screens/PosScreen.tsx` | Migrated + money safety |
| `src/screens/MonthlyReportScreen.tsx` | Money safety wrappings |
| `src/screens/ProductProfitabilityScreen.tsx` | Money safety wrappings |
| `src/screens/PurchaseOrdersScreen.tsx` | Migrated + money safety |
| `src/screens/StockAdjustmentsScreen.tsx` | Migrated |
| `src/screens/BusinessProfileScreen.tsx` | Migrated |
| `src/screens/SettingsScreen.tsx` | Migrated |
| `src/screens/OnboardingScreen.tsx` | Migrated |
| `src/screens/SuppliersScreen.tsx` | Migrated |
| `src/screens/AdminScreen.tsx` | Migrated |
| `src/screens/ProductCatalogScreen.tsx` | Migrated |
| `src/screens/RecordSale.tsx` | Migrated |
| `src/App.tsx` | Migrated |

---

## Verification

```bash
npm run typecheck    # ✅ zero errors
npm run lint         # ✅ zero errors (6 pre-existing warnings)
npm run test:run     # ✅ 54 tests
npm run build        # ✅
```
