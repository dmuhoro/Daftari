# Daftari — Engineering Standards

## Commit Format (Conventional Commits)
```
feat:        new feature
fix:         bug fix
chore:       tooling, deps, config
docs:        documentation only
refactor:    code improvement, no behaviour change
ci:          CI/CD pipeline changes
test:        adding or updating tests
```

Examples:
```
feat: add SMS parser pattern for Airtel Money
fix: parseMpesa pattern C missing sender field
chore: upgrade Dexie to v3.2
docs: add ADR-008 for payment method selection
```

## Quality Gates (must pass before push)
```bash
npm run typecheck   # zero errors
npm run lint        # zero errors
npm run test:run    # zero failures
npm run build       # must succeed
```

## Engineering Rules
- No raw `+ - * /` arithmetic on KES amounts — use `src/lib/money.ts`
- No direct Dexie imports in feature components — use `src/lib/repository.ts`
- No `console.log` — use `src/lib/logger.ts`
- No hardcoded strings in UI — all text via `t()` from `useTranslation`
- No hardcoded table names — use `TABLES` from `src/lib/constants.ts`
- New Dexie tables require a version bump in `db.ts`
- Every new i18n key must be in BOTH `sw.json` and `en.json`

## Testing Requirements
- Business logic functions: unit tested in `*.test.ts` alongside the file
- New SMS patterns: added to `parseMpesa.test.ts`
- Money calculations: added to `money.test.ts`

## Accessibility
- All interactive elements have `aria-label`
- All form inputs have associated `<label>` elements
- Minimum touch target: 48×48px
- Color is never the sole indicator of meaning
