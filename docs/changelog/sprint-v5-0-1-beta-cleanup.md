# Sprint v5.0.1 — Beta Cleanup

**Release date:** 2026-07-19  
**Version:** `5.0.1`  
**Theme:** Closing critical data resilience, validation & UX gaps

---

## What was built

### Data Safety

- **Complete cloud restore**: `pullFromSupabase` now restores all 7 entity types (transactions, businesses, customers, daily closes, suppliers, purchase orders, stock adjustments) instead of only 2. Missing Supabase tables gracefully skipped.
- **Silent catch blocks eliminated**: 6 critical `catch {}` blocks now log `console.warn` (ProductCatalogScreen, SMSParser, RecordSale, OnboardingScreen, PosScreen, Receipt).
- **Global unhandledrejection handler**: Added in `main.tsx`.
- **Category change confirmation**: Modal warns before clearing products on business category change.
- **Global promise rejection handler**: `unhandledrejection` events caught and logged.

### Validation & Integrity

- **Duplicate product name check**: Case-insensitive duplicate check with `confirm()` dialog before adding.
- **Duplicate supplier check**: Name and phone duplicate check with `confirm()` dialog.
- **Input maxLength enforcement**: All description/notes fields enforce `maxLength={200}`.
- **Empty state**: StockAdjustmentsScreen now shows descriptive empty state.

### Performance

- **Search debouncing**: 300ms debounce on search inputs in HistoryScreen, PosScreen, CustomersScreen.
- **Virtualized customer list**: CustomersScreen uses `react-virtuoso` for efficient rendering of large customer lists.

### Sync & Data Management

- **Sync queue purge**: Successfully synced entries deleted from queue (not just marked synced).
- **`getPendingCount()`**: Exported from syncQueue for future sync status UI.

### Accessibility

- **ARIA labels**: Added to back buttons, search inputs, scan buttons, cart qty controls, filter toggles, language/business switchers across 5 screens.

---

## Files changed

| File | Change |
|------|--------|
| `CHANGELOG.md` | Added v5.0.1 items |
| `package.json` | 5.0.0 → 5.0.1 |
| `docs/changelog/sprint-v5-0-1-beta-cleanup.md` | Updated |
| `src/lib/syncAll.ts` | Added pull for 5 missing entity types |
| `src/main.tsx` | `unhandledrejection` handler |
| `src/features/sync/syncQueue.ts` | Purge synced entries, `getPendingCount()` export |
| `src/screens/ProductCatalogScreen.tsx` | Silent catch → warn, duplicate name check |
| `src/screens/SuppliersScreen.tsx` | Duplicate name/phone check, maxLength |
| `src/screens/PurchaseOrdersScreen.tsx` | maxLength on notes |
| `src/screens/StockAdjustmentsScreen.tsx` | Empty state text, ARIA label, maxLength |
| `src/features/sms/SMSParser.tsx` | Silent catch → warn |
| `src/features/transactions/RecordSale.tsx` | Silent catch → warn, maxLength |
| `src/features/transactions/RecordExpense.tsx` | maxLength on description |
| `src/features/transactions/RecordWithdrawal.tsx` | maxLength on note |
| `src/screens/OnboardingScreen.tsx` | Silent catch → warn |
| `src/screens/PosScreen.tsx` | Silent catch → warn, ARIA labels, debouncedSearch |
| `src/components/Receipt.tsx` | Silent catch → warn |
| `src/screens/SettingsScreen.tsx` | Category change confirmation dialog |
| `src/screens/CustomersScreen.tsx` | Virtualized list (react-virtuoso), ARIA labels, debouncedSearch |
| `src/screens/HistoryScreen.tsx` | Debounced search, ARIA labels |
| `src/screens/DashboardScreen.tsx` | ARIA labels |

---

## Verification

```bash
npm run typecheck    # ✅
npm run lint         # ✅ (0 errors, 5 pre-existing warnings)
npm run test:run     # ✅ (53 tests)
npm run build        # ✅
```
