# Changelog

All notable changes to Daftari are documented here.
Format: [Semantic Versioning](https://semver.org)

---

## [3.0.0] — 2026-07-19

### Added
- **Multi-Business Support**: Run multiple businesses under one account. Business switcher dropdown in Dashboard header. Add New Business in Settings. All transactions scoped by active business.
- **Product Profitability Screen**: Dedicated screen showing per-product revenue, cost of goods sold, margin (KES + %), and units sold. Horizontal bar chart for top-10 margin visualization. Accessible from Settings → Data & Reports.
- **Product Profitability Dashboard Card**: Shows today's top-selling products with revenue, cost, and margin breakdown directly on the Dashboard.
- **Cost Price on Products**: New `cost_price` field on products. When recording a sale from a product, the cost price is used to calculate profit margin.
- **Supabase Pull-to-Restore**: New "Restore from Cloud" button in Settings → Data & Reports. Downloads all transactions, businesses, daily closes, and customers from Supabase. Last-write-wins conflict resolution via `updated_at` timestamps.
- **Sync All Tables**: Business, daily closes, and customer records now sync to Supabase via the sync queue (previously only transactions synced).
- **Dexie Schema v5**: New `business_id`, `product_id`, `cost_price`, `updated_at` fields on transactions. New `purchase_orders` table. All tables now have `local_id` and `updated_at` for proper sync.
- **3 new files**: `lib/syncAll.ts`, `screens/ProductProfitabilityScreen.tsx`, `docs/changelog/sprint-11-business-os-completed.md`

### Changed
- `App.tsx` — loads all businesses from Dexie, sets activeBusinessId, maps business data with local_id
- `DashboardScreen.tsx` — business switcher dropdown in header, product profitability card in Today tab
- `SettingsScreen.tsx` — "My Businesses" section with switcher + Add Business, Product Profitability link, Restore from Cloud button
- `AppShell.tsx` — added `product-profitability` route
- `lib/db.ts` — schema v5 with business_id, product_id, cost_price, updated_at, purchase_orders
- `lib/store.ts` — businesses[], activeBusinessId, setBusinesses, addBusiness, setActiveBusinessId, updateTransaction now syncs updated_at
- `features/sync/syncQueue.ts` — QueuePayload extended with business_id, product_id, cost_price, updated_at
- `package.json` — version 2.0.0 → 3.0.0

## [2.0.0] — 2026-07-19

### Added
- **Edit/Delete Transactions**: Long-press or hover to reveal edit/delete buttons on any transaction row. Edit sheet allows changing amount, description, category, date, and time. Delete shows confirmation dialog with undo snackbar (4s window).
- **Smart Search + Filters**: Search bar searches across amount, description, category, and M-Pesa sender. Filter drawer with type chips (sales/expenses/withdrawals), category dropdown, payment method dropdown, and date range picker (from/to).
- **Infinite Scroll Pagination**: HistoryScreen loads 50 transactions at a time via Intersection Observer — busy dukas with thousands of transactions no longer freeze.
- **Monthly P&L Report**: New dedicated screen with month navigator, profit card with prior-month comparison %, daily profit bar chart, and category breakdown pie charts for both revenue and expenses.
- **CSV Export**: Download all transactions as CSV from both HistoryScreen (toolbar button) and SettingsScreen ("Export CSV" row). Compatible with Excel/Google Sheets.
- **Customer 360° Detail Screen**: Tap any customer to see full transaction history, total spent, visit count, last visit date. Tap phone to dial or WhatsApp directly. Manual customer creation with name + phone.
- **Enhanced Fuliza Dashboard**: Running total debt display on dashboard, estimated interest (5%), total taken vs. repaid, today's estimated Fuliza cost.
- **Product-Level Profitability Foundation**: Monthly P&L now breaks down revenue and expenses by category for the first step toward per-product margin analysis.
- **10 new i18n keys**: `monthly_report`, `transaction_deleted` added to both `sw.json` and `en.json`.

### Changed
- `HistoryScreen.tsx` — complete rewrite: edit/delete, search, filters, pagination, export
- `DashboardScreen.tsx` — Fuliza section expanded with running balance, interest, cost tracking
- `CustomersScreen.tsx` — tappable rows navigate to new `CustomerDetailScreen`, add-customer modal
- `SettingsScreen.tsx` — new "Data & Reports" section with Monthly Report link and CSV export
- `AppShell.tsx` — added `monthly-report` route
- `lib/store.ts` — added `updateTransaction` and `deleteTransaction` actions with Supabase sync
- `package.json` — version 1.5.0 → 2.0.0

### New Files
- `src/screens/MonthlyReportScreen.tsx` — full monthly P&L with charts
- `src/screens/CustomerDetailScreen.tsx` — customer 360° transaction history
- `src/lib/csv.ts` — CSV generation and download utility

## [1.5.0] — 2026-07-19

### Added
- **Password Reset Flow**: "Forgot Password?" link on sign-in form, triggers `supabase.auth.resetPasswordForEmail()` with redirect, inline `ResetPasswordScreen`-style recovery UI on redirect
- **Recovery Mode**: `PASSWORD_RECOVERY` event listener in `App.tsx` sets `authMode='reset_password'` on redirect with `type=recovery`
- **Resend Confirmation**: Error-bound resend confirmation email on `sign_in` with `email_not_confirmed` error
- **Signed-in Badge**: Shows email + "Signed in as" indicator in Settings screen
- **OG Meta Tags**: Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`) added to `index.html`
- **`robots.txt`**: Search-engine crawl rules at `public/robots.txt`
- **Missing Track Call**: `handleAddAllTemplates` in `RecordSale.tsx` now fires `TRANSACTION_RECORDED` event
- **i18n Keys**: 10 new keys for password reset, confirmation resend, signed-in state
- **Test Setup**: `src/test/mocks.ts` wired into vitest `setupFiles`

### Removed
- **Dead i18n Keys**: 28 unused translation keys removed from both `sw.json` and `en.json` for a clean 1:1 match with usage

### Engineering
- `scripts/check-i18n.ts` — `DYNAMIC_KEYS` exclusion list for programmatically-used keys (`sale_recorded`, `expense_recorded`, `withdrawal_recorded`)

## [1.4.0] — 2026-07-19

### Added
- **Self-hosted Sentry Integration**: Error tracking with DSN config via `VITE_SENTRY_DSN`, release tagging, PII redaction in `beforeSend`, ignore list for benign errors
- **Error Boundary**: `ErrorBoundary` now forwards crashes to Sentry via `captureError()`
- **Repository Instrumentation**: All Dexie read/write failures in `repository.ts` captured to Sentry with feature/action tags
- **Privacy-first Analytics**: Self-hosted `daftari_analytics` table in Supabase with event buffering (flush at 10 events), RLS restricted to service_role only
- **Analytics Events**: 18 event types tracked across onboarding, auth, transaction recording, SMS parsing, receipt view, WhatsApp share, daily close, customer views, sign-out
- **OnboardingSessionCounter**: Tracks session count via `sessionStorage` and fires `onboarding_abandoned` at 3 sessions without completion
- **Sync Queue Circuit Breaker**: `MAX_BATCH=50` overflow protection, 3 consecutive failures open circuit for 60s, Sentry capture on circuit open and overflow
- **i18n Coverage Linter**: `scripts/check-i18n.ts` validates all `t()` keys against `sw.json`/`en.json`, detects missing/extra keys, runs in CI
- **React.lazy Routing**: 13 screens lazily loaded via `React.lazy()` + Suspense in AppShell
- **Content Security Policy**: CSP header added to Vercel config (`default-src 'self'`, Supabase connect-src)
- **ESLint Daftari Rules**: `no-explicit-any` enforced as error, Dexie direct import blocked
- **Global Test Mocks**: `src/test/mocks.ts` with mock Dexie DB for unit tests
- **CI Pipeline**: GitHub Actions workflow at `.github/workflows/ci.yml` with typecheck, lint, i18n check, test, build
- **404 Fallback Page**: Custom `public/404.html` with Daftari branding for SPA routes
- **Supabase Analytics Migration**: `supabase/migrations/002_create_daftari_analytics.sql` with RLS policies and indexes

### Changed
- `tsconfig.app.json` — added `baseUrl` and `@/*` path alias
- `.env.example` — added `VITE_SENTRY_DSN` documentation
- `vercel.json` — added CSP header for all routes
- README — updated with new features, Sentry, analytics, i18n linter
- All transaction recording components now fire `analytics.track()` 

### Engineering
- Created `src/lib/sentry.ts` — Sentry init, captureError, setUser, clearUser
- Created `src/lib/analytics.ts` — event queue, flush, EVENTS const
- Created `src/components/OnboardingSessionCounter.tsx`
- Created `scripts/check-i18n.ts` — i18n coverage linter for CI
- Created `src/test/mocks.ts` — global Dexie mock factory
- Created `.github/workflows/ci.yml` — CI/CD pipeline
- Created `public/404.html` — SPA 404 fallback
- Created `supabase/migrations/002_create_daftari_analytics.sql`
- Added 18 analytic event track() calls across screens and features
- 53 tests passing across 4 test files

## [1.3.0] — 2026-07-19

### Added
- **CI/CD pipeline**: GitHub Actions quality gate (typecheck, lint, test, build) + auto-deploy to Vercel on main
- **SMS parser hardening**: handles 12-digit Kenyan phone numbers, prevents name/phone confusion, 50 tests
- **Payment method detection**: all SMS patterns now extract payment method (M-Pesa, Till, Paybill, Pochi, Airtel Money)
- **Engineering standards**: `.nvmrc`, `AGENTS.md`, professional `CONTRIBUTING.md`
- **User profile in Settings**: Account section shows authenticated user email, account creation date, and last sign-in time

### Removed
- All Bolt.ai artifacts (`.bolt/` directory, README badge, ADR mention)
- Generic "start repository" boilerplate
- 2 React lint warnings in HistoryScreen.tsx

### Engineering
- CI workflow renamed to CI/CD with deploy job
- Node version bumped to 22 in CI
- Lockfile regenerated with esbuild 0.28.1 optional deps correctly marked
- Phone regex `[A-Z0-9]{6,10}` → `\d{6,12}` and `[A-Z0-9]` → `\d` in extractSenderPhone
- `handleRefresh` wrapped in `useCallback`, ref captured in effect closure

## [1.2.0] — 2026-07-19

### Added
- **Business categories system**: 7 categories, 30 subcategories, each with 8-12 template products (KES pricing + units), income category labels, dashboard personalization labels — all bilingual (sw/en)
- **Personalized Dashboard**: category emoji + label in header, per-category income/expense card labels (e.g. "Mauzo/Sales" → "Nauli/Fares"), personalized empty state messages per business type
- **Business Profile screen**: editable business name + owner name, category display with emoji, payment method chips, save to Dexie + Supabase
- **Category picker in Settings**: inline category/subcategory picker to change business type after onboarding, persists to Dexie + Supabase
- **Income categories per business type**: 3 unique income category options per category (e.g. food → Food/Beverages/Other, transport → Fare/Delivery/Other)
- **Template product quick-add**: "Add All Templates" button in RecordSale for new users with no saved products
- **Cash-only mode**: SMS parser and Fuliza section hidden for businesses using only cash
- **Business loading gate**: `isLoadingBusiness` state in App.tsx loads business from Dexie on session change, prevents routing before data ready

### Fixed
- **Bottom nav icon colors invisible after dark mode**: explicit icon/label colors (active green-600/green-400, inactive stone-500/stone-400), `pb-20` content padding to clear fixed nav, active indicator bar, `safe-area-inset-bottom` on nav
- **Onboarding redirect hangs when Supabase slow**: Dexie-first architecture — business written to IndexedDB immediately, `setBusiness` + navigation before non-blocking Supabase upsert
- **Empty catch blocks**: lint errors resolved with console.warn for background sync failures

### Engineering
- Created `categoryEmoji`, `getTemplateProducts()`, `getCategoryLabels()`, `CATEGORY_DASHBOARD_LABELS` helpers in `businessCategories.ts`
- Created `LoadingScreen.tsx` reusable splash component
- Added `incomeCategories` to every BUSINESS_CATEGORY entry
- Added 7 i18n keys to sw.json and en.json (`business_profile`, `owner_name`, `owner_name_placeholder`, `payment_methods`, `saved`, `change_category`, `loading`)

## [1.1.0] — 2026-07-18

### Added
- Language toggle restored to Settings (chip-style: Kiswahili / English) and Auth screen (SW | EN)
- Dark mode system with 3 options: Light, Dark, System — instant switching
- Theme persistence across app restarts (stored in Zustand)
- Transaction success flash (animated 1.2s overlay after recording a sale/expense/withdrawal)
- Sync status dot indicator on Dashboard header (green/amber/grey/red)
- Recording streak counter (consecutive days of use) with Flame chip on Dashboard
- History date filter tabs: This Week / This Month / All
- Onboarding gate verification: new users always see category selection flow
- CSS custom properties for dark mode surface/card/ink/muted/border colors

### Fixed
- Language toggle was overwritten during phase build — restored with improved UI
- Onboarding flow wiring verified in App.tsx (loading state, Dexie lookup, gate logic)
- Input font-size set to 16px to prevent iOS auto-zoom

## [1.0.0] — 2026-06-18

### Added
- Auth: email + password sign up and sign in via Supabase
- Transaction engine: income, expense, withdrawal recording
- Fuliza debt tracking (debt_taken + debt_repaid) with alert card
- Quick-add: configurable product chips (chapati KES 20 default)
- M-Pesa SMS parser: 3 Safaricom patterns + fallback (fully offline)
- Today dashboard: profit hero card, revenue, expenses, cash available
- Weekly dashboard: 7-day Recharts bar chart, best day, week totals
- Transaction history: date-grouped, pull-to-refresh
- Daily close flow: 8pm EAT bottom sheet with day P&L summary
- Offline-first: full operation on airplane mode via Dexie.js IndexedDB
- Background sync: queue flushes to Supabase on connectivity restore
- Kiswahili + English language toggle (Kiswahili default)
- PWA: installable on Android Chrome, service worker, offline fallback
- Supabase RLS on all tables (owner_id isolation)

### Engineering
- Centralized money arithmetic (src/lib/money.ts)
- Type system: branded IDs, Result<T,E>, discriminated unions
- Repository pattern abstracting Dexie access
- Structured logger (silent in production)
- Vitest unit tests for money, SMS parser, profit calculations
- GitHub Actions CI: typecheck, lint, test, build on every PR
- Architecture Decision Records (docs/adr/)
- AI-context engineering agents: 10 specialist SDLC agents (ai-context/)
