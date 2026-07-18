# Contributing to Daftari

## Branch Naming
feat/description    — new feature
fix/description     — bug fix
chore/description   — tooling, deps, config
docs/description    — documentation only
refactor/description — code improvement, no behaviour change

## Commit Format (Conventional Commits)
feat: add boda boda category to onboarding
fix: parseMpesa pattern C missing sender field
chore: upgrade Dexie to v3.2
docs: add ADR-008 for payment method selection

## Before Opening a PR
1. npm run typecheck  — must pass with zero errors
2. npm run lint       — must pass with zero errors
3. npm run test:run   — must pass with zero failures
4. npm run build      — must succeed

## Engineering Rules
- No raw + - * / arithmetic on KES amounts — use src/lib/money.ts
- No direct Dexie imports in feature components — use src/lib/repository.ts
- No console.log — use src/lib/logger.ts
- No hardcoded strings in UI — all text via t() from useTranslation
- No hardcoded table names — use TABLES from src/lib/constants.ts
- New Dexie tables require a version bump in db.ts
- Every new i18n key must be in BOTH sw.json and en.json

## Testing Requirements
- Business logic functions: unit tested in *.test.ts alongside the file
- New SMS patterns: added to parseMpesa.test.ts
- Money calculations: added to money.test.ts

## Accessibility Requirements
- All interactive elements have aria-label
- All form inputs have associated label elements
- Minimum touch target: 48×48px
- Color is never the sole indicator of meaning
