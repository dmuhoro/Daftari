# Daftari — Business Ledger for Kenyan SMEs

Offline-first PWA for Kenyan small businesses. Track sales, expenses, M-Pesa payments, inventory, and customers — all without a constant internet connection.

Built with React, TypeScript, Vite, Supabase, and Dexie.js.

## Features

- **M-Pesa SMS Parsing** — Paste any M-Pesa message and auto-fill the amount, sender, and payment method
- **Offline-First** — All data stored locally in IndexedDB, syncs to cloud when online
- **Receipts** — Auto-generated receipt IDs for every sale (e.g. `REC-250719-0001`)
- **WhatsApp Sharing** — Share receipts and daily summaries directly to WhatsApp
- **Customer Intelligence** — Automatic customer tracking from M-Pesa senders
- **Inventory Management** — Track stock levels with low-stock alerts and restock functionality
- **Bilingual** — Full Kiswahili and English support
- **Dark Mode** — Light, dark, and system-follow themes
- **Fuliza Tracking** — Track Fuliza debt against daily revenue
- **Daily Close** — Automated end-of-day prompts with profit summary
- **PWA** — Install on your phone's home screen for app-like experience
- **Error Tracking** — Sentry integration with production error capture
- **Analytics** — Privacy-first event analytics via Supabase (no third-party trackers)
- **Digital Receipts** — Auto-generated receipt numbers (`REC-YYMMDD-XXXX`) for every sale

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, TailwindCSS |
| State | Zustand (persisted to localStorage) |
| Offline DB | Dexie.js (IndexedDB) |
| Backend | Supabase (Postgres, Auth, Storage) |
| Charts | Recharts |
| Error Tracking | Sentry |
| Analytics | Supabase (self-hosted) |
| PWA | vite-plugin-pwa, Workbox |
| Testing | Vitest, React Testing Library |
| CI/CD | GitHub Actions → Vercel |

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test:run` | Run all tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npx tsx scripts/check-i18n.ts` | i18n coverage linter |

## Project Structure

```
src/
├── components/     # Reusable UI (Shell, Receipt, SuccessFlash, etc.)
├── features/       # Feature modules (sms, sync, transactions, close)
├── hooks/          # Custom React hooks (useTranslation, useSync, etc.)
├── i18n/           # Translations (sw.json, en.json)
├── lib/            # Core: store, db, repository, money, receiptId, whatsapp, sentry, analytics
├── screens/        # Full-page screens (dashboard, history, settings, etc.)
├── test/           # Test setup and global mocks
├── App.tsx         # Root component with auth & onboarding routing
├── main.tsx        # Entry point (Sentry init, React root)
└── scripts/        # Dev tooling (i18n linter)
```

## License

MIT
