# Sprint v5.3.0 — Beta Readiness

**Release date:** 2026-07-20  
**Version:** `5.3.0`  
**Theme:** Hardening data integrity, sync reliability, and type safety for beta launch

---

## What was done

### A — DB schema completeness (synced field)

The `synced` field was missing from 3 interfaces (`Business`, `DailyClose`, `Customer`) in `db.ts`. This meant the Dexie store schema was out of sync with the TypeScript types — `synced` was indexed in stores but absent from the interface, causing silent data loss on sync (the field would be undefined at runtime when missing from object literals).

- Added `synced: number` to `Business`, `DailyClose`, `Customer` interfaces
- Bumped Dexie DB version from `6` to `7`
- Added `synced` index to store schema for `business`, `daily_closes`, `customers`, `purchase_orders`, `suppliers`, `stock_adjustments`
- Fixed all call sites creating these entities without `synced: 0`:
  - `DailyClose.tsx` — saveDailyClose call
  - `SMSParser.tsx` — saveCustomer call
  - `CustomersScreen.tsx` — saveCustomer call
  - `OnboardingScreen.tsx` — addBusiness call
  - `SettingsScreen.tsx` — addBusiness call (New Business flow)

### B — Removed unsafe `as Business` cast

`saveBusiness()` in `repository.ts` was creating `{ name, currency, created_at }` and casting to `Business` with `as Business`, hiding the fact that `synced` and other required fields were missing. Converted to a properly typed object literal with `synced: 0`.

### C — Wired up `syncAllTables()` for non-transaction entities

`syncAllTables()` in `src/lib/syncAll.ts` was fully implemented (syncs businesses, daily closes, customers to Supabase) but **never called** — dead code that was written but forgotten. This meant non-transaction entities only synced via fire-and-forget direct Supabase calls from individual screens, with no offline queue or retry.

- `useSync()` hook now calls `syncAllTables()` alongside `flushQueue()` on:
  - Initial mount (when online)
  - Transition from offline → online
- This closes a sync gap: customers, daily closes, and businesses now reliably reach the cloud when connectivity is restored

### D — Verification

```bash
npm run typecheck    # ✅ zero errors
npm run lint         # ✅ zero errors, zero warnings
npm run test:run     # ✅ 73 tests (8 files)
npm run build        # ✅ PWA build with service worker
```

---

## Files changed

| File | Change |
|------|--------|
| `CHANGELOG.md` | Added v5.3.0 section |
| `docs/changelog/sprint-v5-3-0-beta-readiness.md` | Created (this file) |
| `package.json` | Version 5.2.0 → 5.3.0 |
| `src/lib/db.ts` | Added `synced` to Business, DailyClose, Customer; v6→v7; synced index on all tables |
| `src/lib/repository.ts` | Fixed `saveBusiness()` — removed `as Business` cast, added `synced: 0` |
| `src/hooks/useSync.ts` | Calls `syncAllTables()` alongside `flushQueue()` |
| `src/features/close/DailyClose.tsx` | Added `synced: 0` to saveDailyClose call |
| `src/features/sms/SMSParser.tsx` | Added `synced: 0` to saveCustomer call |
| `src/screens/CustomersScreen.tsx` | Added `synced: 0` to saveCustomer call |
| `src/screens/OnboardingScreen.tsx` | Added `synced: 0` to addBusiness call |
| `src/screens/SettingsScreen.tsx` | Added `synced: 0` to addBusiness call |

---

## Risk assessment

| Risk | Mitigation |
|------|-----------|
| DB v6→v7 migration: existing users lose `synced` data on upgrades | Dexie auto-creates new indexes on version upgrade; existing `synced` values (if any exist) are preserved. The `synced` field defaults to `0` on new objects |
| `syncAllTables()` now fires on every reconnect — network storm if flaky connection | Single batched call per reconnect event; Supabase handles dedup via `onConflict: 'local_id'` |
| `saveBusiness()` no longer works if `Business` gains more required fields | The function now uses a properly typed literal — future field additions will cause compile-time errors instead of runtime `undefined` values |

---

## Final tally

| Metric | Before | After |
|--------|--------|-------|
| DB schema <-> interface parity | 3 mismatches | 0 |
| `as Entity` casts in repository | 10 | 9 (all safe `Omit<Entity,'id'>` patterns) |
| Dead `syncAllTables()` | defined but not called | wired into useSync |
| Typecheck errors | 0 | 0 |
| Lint warnings | 0 | 0 |
| Passing tests | 73 | 73 |
| Build | ✅ | ✅ |
