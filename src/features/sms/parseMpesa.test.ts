import { describe, it, expect } from 'vitest'
import { parseMpesaSMS } from './parseMpesa'

describe('parseMpesaSMS — Pattern A (English full)', () => {
  it('parses standard received SMS', () => {
    const sms = 'You have received KSh 200 from JOHN KAMAU 254712345678 on 07/06/26 at 14:30'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(200)
    expect(result?.sender).toContain('JOHN KAMAU')
  })

  it('parses amount with comma separator', () => {
    const sms = 'You have received KSh 1,500 from MARY WANJIRU 254798123456 on 07/06/26 at 09:15'
    const result = parseMpesaSMS(sms)
    expect(result?.amount).toBe(1500)
  })
})

describe('parseMpesaSMS — Pattern B (Confirmed short)', () => {
  it('parses confirmed short format', () => {
    const sms = 'Confirmed. KSh 350 received from PETER MWANGI 254711222333'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(350)
  })
})

describe('parseMpesaSMS — Pattern C (Kiswahili)', () => {
  it('parses Kiswahili format', () => {
    const sms = 'Umepokea KSh 100 kutoka kwa ALICE NJERI'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(100)
  })
})

describe('parseMpesaSMS — failure cases', () => {
  it('returns null for unrecognized format', () => {
    expect(parseMpesaSMS('Hello, how are you?')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(parseMpesaSMS('')).toBeNull()
  })
  it('returns null for partial SMS', () => {
    expect(parseMpesaSMS('You have received')).toBeNull()
  })
})
