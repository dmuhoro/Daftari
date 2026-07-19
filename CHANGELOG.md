# Changelog

All notable changes to Daftari are documented here.
Format: [Semantic Versioning](https://semver.org)

---

## [1.3.0] — 2026-07-19

### Added
- **CI/CD pipeline**: GitHub Actions quality gate (typecheck, lint, test, build) + auto-deploy to Vercel on main
- **SMS parser hardening**: handles 12-digit Kenyan phone numbers, prevents name/phone confusion, 50 tests
- **Payment method detection**: all SMS patterns now extract payment method (M-Pesa, Till, Paybill, Pochi, Airtel Money)
- **Engineering standards**: `.nvmrc`, `AGENTS.md`, professional `CONTRIBUTING.md`

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
