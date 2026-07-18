# Changelog

All notable changes to Daftari are documented here.
Format: [Semantic Versioning](https://semver.org)

---

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
