# Daftari

Business management platform for Kenyan SMEs. Offline-first PWA with M-Pesa SMS integration, inventory, and multi-channel sales tracking.

Built with React, TypeScript, Vite, Supabase, and Dexie.js.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 5, TailwindCSS, Zustand
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **PWA:** vite-plugin-pwa, Workbox
- **Offline:** Dexie.js (IndexedDB)
- **Testing:** Vitest, React Testing Library
- **CI/CD:** GitHub Actions → Vercel

## Quick Start

```bash
npm install
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test:run` | Run all tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Project Structure

```
src/
├── components/     # Reusable UI components
├── features/       # Feature modules (sms, sync, transactions)
├── hooks/          # Custom React hooks
├── i18n/           # Translations (sw, en)
├── lib/            # Core libraries (store, money, repository)
├── screens/        # Screen-level components
└── App.tsx         # Root component
```
