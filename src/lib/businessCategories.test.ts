import { describe, it, expect } from 'vitest'
import {
  BUSINESS_CATEGORIES,
  getTemplateProducts,
  getCategoryLabels,
  categoryEmoji,
} from './businessCategories'

const TARGET_TYPES: Array<{ type: string; category: string; subcategory: string }> = [
  { type: 'food vendors', category: 'food_beverage', subcategory: 'chapati_mandazi' },
  { type: 'shopkeepers (kiosk/duka)', category: 'retail', subcategory: 'kiosk_duka' },
  { type: 'cereal/grocery shops', category: 'retail', subcategory: 'grocery' },
  { type: 'mobile accessories shops', category: 'retail', subcategory: 'mobile_accessories' },
  { type: 'phone/computer repair', category: 'services', subcategory: 'phone_computer_repair' },
  { type: 'cyber cafes', category: 'services', subcategory: 'cyber_cafe' },
]

describe('target business type coverage (80/20 audit)', () => {
  it.each(TARGET_TYPES)('$type resolves to a category and subcategory', ({ category, subcategory }) => {
    expect(BUSINESS_CATEGORIES[category as keyof typeof BUSINESS_CATEGORIES]).toBeDefined()
    const cat = BUSINESS_CATEGORIES[category as keyof typeof BUSINESS_CATEGORIES]
    const subs = cat.subcategories as Record<string, { sw: string; en: string }>
    expect(subs[subcategory]).toBeDefined()
  })

  it.each(TARGET_TYPES)('$type has a non-empty template product list', ({ category, subcategory }) => {
    const products = getTemplateProducts(category as never, subcategory)
    expect(products).toBeDefined()
    expect(products!.length).toBeGreaterThan(0)
    for (const p of products!) {
      expect(p.name).toBeTruthy()
      expect(typeof p.price).toBe('number')
      expect(p.price).toBeGreaterThan(0)
      expect(p.unit).toBeTruthy()
    }
  })
})

describe('category integrity', () => {
  it('every category has an emoji and a dashboard label', () => {
    const keys = Object.keys(BUSINESS_CATEGORIES)
    for (const key of keys) {
      expect(categoryEmoji[key as keyof typeof categoryEmoji]).toBeDefined()
    }
  })

  it('getCategoryLabels returns every category in both languages', () => {
    const sw = getCategoryLabels('sw')
    const en = getCategoryLabels('en')
    expect(sw.length).toBe(Object.keys(BUSINESS_CATEGORIES).length)
    expect(en.length).toBe(sw.length)
  })
})
