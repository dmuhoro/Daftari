#!/usr/bin/env npx tsx
/**
 * i18n coverage linter — run via:
 *   npx tsx scripts/check-i18n.ts
 *
 * Checks:
 * 1. Every key in sw.json exists in en.json (and vice versa)
 * 2. Every key used in t('key') calls exists in both JSON files
 * 3. Reports unused translation keys
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const sw: Record<string, string> = JSON.parse(readFileSync(join(root, 'src/i18n/sw.json'), 'utf-8'))
const en: Record<string, string> = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf-8'))

const swKeys = new Set(Object.keys(sw))
const enKeys = new Set(Object.keys(en))

let exitCode = 0

function fail(msg: string) {
  console.error(`❌ ${msg}`)
  exitCode = 1
}

// 1. Cross-check SW ↔ EN
for (const k of swKeys) {
  if (!enKeys.has(k)) fail(`Key "${k}" exists in sw.json but NOT in en.json`)
}
for (const k of enKeys) {
  if (!swKeys.has(k)) fail(`Key "${k}" exists in en.json but NOT in sw.json`)
}

// 2. Walk src/ and collect t() calls
const SRC = join(root, 'src')

const tCalls = new Set<string>()

function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      walk(full)
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
      const content = readFileSync(full, 'utf-8')
      for (const match of content.matchAll(/(?<![$\w])t\(['"]([^'"]+)['"][,)]/g)) {
        tCalls.add(match[1])
      }
    }
  }
}

walk(SRC)

for (const k of tCalls) {
  if (!swKeys.has(k)) fail(`Translation key "${k}" used in source but MISSING from sw.json`)
  if (!enKeys.has(k)) fail(`Translation key "${k}" used in source but MISSING from en.json`)
}

// Keys used dynamically (assigned to a variable then passed to t())
const DYNAMIC_KEYS = new Set([
  'sale_recorded', 'expense_recorded', 'withdrawal_recorded',
  // OnboardingScreen option cards assign these to `labelKey` (typed TranslationKey)
  // and render via t(card.labelKey) — the regex cannot see them as t('...').
  'pain_uncollected_debts', 'pain_unknown_profit', 'pain_mixed_money', 'pain_stock_loss',
  'method_paper_book', 'method_memory', 'method_mpesa_sms', 'method_none',
])

for (const k of DYNAMIC_KEYS) {
  if (swKeys.has(k)) tCalls.add(k)
}

// 3. Report unused keys
const unused = [...swKeys].filter(k => !tCalls.has(k))
if (unused.length > 0) {
  console.warn(`⚠️  ${unused.length} unused translation keys:\n   ${unused.join('\n   ')}`)
}

if (exitCode === 0) {
  console.log(`✅ i18n check passed — ${tCalls.size} keys in use, ${swKeys.size} in sw.json, ${enKeys.size} in en.json`)
}

process.exit(exitCode)
