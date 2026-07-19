# Sprint v5.0.1 — Beta Cleanup

**Release date:** 2026-07-19  
**Version:** `5.0.1`  
**Theme:** Closing critical data resilience & validation gaps

---

## What was built

### Data Safety

- **Complete cloud restore**: `pullFromSupabase` now restores all 7 entity types (transactions, businesses, customers, daily closes, suppliers, purchase orders, stock adjustments) instead of only 2. Missing Supabase tables are gracefully skipped so older deployments don't error.
- **Silent catch blocks eliminated**: Every critical `catch {}` block now logs a `console.warn` with the error:
  - ProductCatalogScreen (Supabase product sync)
  - SMSParser (customer upsert from M-Pesa)
  - RecordSale (stock cloud sync)
  - OnboardingScreen (business creation)
  - PosScreen & Receipt (Bluetooth print failure)
- **Global unhandledrejection handler**: Added in `main.tsx` so no async error goes unnoticed.
- **Category change confirmation**: Changing business category now shows a modal warning that all products will be cleared, with a Cancel/Change choice. Previously this was silent and destructive.

### Validation

- **Stock bounds**: Already clamped via `Math.max(0, ...)` — no change needed.
- **Description max length**: `VALIDATION.DESCRIPTION_MAX` defined in constants.

---

## Files changed

| File | Change |
|------|--------|
| `CHANGELOG.md` | Added v5.0.1 section |
| `package.json` | 5.0.0 → 5.0.1 |
| `docs/changelog/sprint-v5-0-1-beta-cleanup.md` | Created (this file) |
| `src/lib/syncAll.ts` | Added pull for customers, daily_closes, suppliers, purchase_orders, stock_adjustments |
| `src/main.tsx` | Added `unhandledrejection` handler |
| `src/screens/ProductCatalogScreen.tsx` | `catch {}` → `console.warn` |
| `src/features/sms/SMSParser.tsx` | `catch {}` → `console.warn` |
| `src/features/transactions/RecordSale.tsx` | `catch {}` → `console.warn` |
| `src/screens/OnboardingScreen.tsx` | `catch {}` → `console.warn` |
| `src/screens/PosScreen.tsx` | `catch { void 0; }` → `console.warn` |
| `src/components/Receipt.tsx` | `catch { void 0; }` → `console.warn` |
| `src/screens/SettingsScreen.tsx` | Category change confirmation dialog |

---

## Verification

```bash
npm run typecheck    # ✅
npm run lint         # ✅ (0 errors, 4 pre-existing warnings)
npm run test:run     # ✅ (53 tests)
npm run build        # ✅
```
