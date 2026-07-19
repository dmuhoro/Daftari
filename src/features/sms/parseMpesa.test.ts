import { describe, it, expect } from 'vitest'
import { parseMpesaSMS } from './parseMpesa'

describe('parseMpesaSMS — Pattern A (English full)', () => {
  it('parses standard received SMS', () => {
    const sms = 'You have received KSh 200 from JOHN KAMAU 254712345678 on 07/06/26 at 14:30'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(200)
    expect(result?.sender).toContain('JOHN KAMAU')
    expect(result?.payment_method).toBe('mpesa_send_money')
  })

  it('parses amount with comma separator', () => {
    const sms = 'You have received KSh 1,500 from MARY WANJIRU 254798123456 on 07/06/26 at 09:15'
    const result = parseMpesaSMS(sms)
    expect(result?.amount).toBe(1500)
    expect(result?.payment_method).toBe('mpesa_send_money')
  })

  it('extracts transaction code from pattern A', () => {
    const sms = 'You have received KSh 500 from JOHN KAMAU 254712345678 on 07/06/26 at 14:30'
    const result = parseMpesaSMS(sms)
    expect(result?.code).toBe('254712345678')
  })

  it('parses timestamp from pattern A', () => {
    const sms = 'You have received KSh 200 from JOHN KAMAU 254712345678 on 07/06/26 at 14:30'
    const result = parseMpesaSMS(sms)
    expect(result?.timestamp).toBeInstanceOf(Date)
    expect(result?.timestamp.getFullYear()).toBe(2026)
    expect(result?.timestamp.getMonth()).toBe(5) // June (0-indexed)
    expect(result?.timestamp.getDate()).toBe(7)
    expect(result?.timestamp.getHours()).toBe(14)
    expect(result?.timestamp.getMinutes()).toBe(30)
  })
})

describe('parseMpesaSMS — Pattern B (Confirmed short)', () => {
  it('parses confirmed short format', () => {
    const sms = 'Confirmed. KSh 350 received from PETER MWANGI 254711222333'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(350)
    expect(result?.payment_method).toBe('mpesa_send_money')
  })
})

describe('parseMpesaSMS — Pattern C (Kiswahili)', () => {
  it('parses Kiswahili format', () => {
    const sms = 'Umepokea KSh 100 kutoka kwa ALICE NJERI'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(100)
    expect(result?.payment_method).toBe('mpesa_send_money')
  })
})

describe('parseMpesaSMS — Pattern D (Pochi La Biashara)', () => {
  it('parses Pochi la Biashara format', () => {
    const sms = 'You have received KSh 500 from JOHN DOE 254712345678 to Pochi la Biashara on 15/07/26 at 10:30'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(500)
    expect(result?.sender).toContain('JOHN DOE')
    expect(result?.payment_method).toBe('pochi_la_biashara')
  })

  it('parses Pochi with comma amount', () => {
    const sms = 'You have received KSh 2,500 from MARY WANJIRU 254798123456 to Pochi la Biashara'
    const result = parseMpesaSMS(sms)
    expect(result?.amount).toBe(2500)
    expect(result?.payment_method).toBe('pochi_la_biashara')
  })

  it('extracts code from Pochi message', () => {
    const sms = 'You have received KSh 300 from PETER KAMAU 254711222333 to Pochi la Biashara. Trans ID ABC123XYZ'
    const result = parseMpesaSMS(sms)
    expect(result?.payment_method).toBe('pochi_la_biashara')
    expect(result?.code).toBe('ABC123XYZ')
  })
})

describe('parseMpesaSMS — Pattern E (Till Number / Buy Goods)', () => {
  it('parses Till Number format with has received', () => {
    const sms = 'DAFTARI SHOP has received KSh 1,200 from JANE WANJIKU 254712345678. Trans ID TILL12345'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(1200)
    expect(result?.sender).toContain('JANE WANJIKU')
    expect(result?.payment_method).toBe('till_number')
    expect(result?.code).toBe('TILL12345')
  })

  it('does not confuse Till with Paybill (Account keyword)', () => {
    const sms = 'DAFTARI LTD has received KSh 3,000 from JOHN KAMAU 254712345678. Account INV-001. Trans CODE123'
    const result = parseMpesaSMS(sms)
    expect(result?.payment_method).toBe('paybill')
  })
})

describe('parseMpesaSMS — Pattern F (Paybill)', () => {
  it('parses Paybill format with Account', () => {
    const sms = 'DAFTARI LTD received KSh 3,000 from JOHN KAMAU 254712345678. Account INV-001. Trans CODE123'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(3000)
    expect(result?.payment_method).toBe('paybill')
    expect(result?.code).toBe('CODE123')
  })

  it('parses Paybill with has received + Account', () => {
    const sms = 'DAFTARI LTD has received KSh 5,500 from ALICE NYAMBURA 254798123456. Account PO-2026. Trans ABC999XYZ'
    const result = parseMpesaSMS(sms)
    expect(result?.amount).toBe(5500)
    expect(result?.payment_method).toBe('paybill')
    expect(result?.code).toBe('ABC999XYZ')
  })

  it('parses Paybill format without has', () => {
    const sms = 'DAFTARI LTD received KSh 1,000 from PETER MWANGI 254711222333. Account RENT. Trans PM2026'
    const result = parseMpesaSMS(sms)
    expect(result?.amount).toBe(1000)
    expect(result?.payment_method).toBe('paybill')
    expect(result?.code).toBe('PM2026')
  })
})

describe('parseMpesaSMS — Pattern G (Airtel Money)', () => {
  it('parses Airtel Money format', () => {
    const sms = 'You have received Ksh 800 from JAMES KARIUKI 254712345678 via Airtel Money. Ref: AIR123456'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(800)
    expect(result?.sender).toContain('JAMES KARIUKI')
    expect(result?.payment_method).toBe('airtel_money')
    expect(result?.code).toBe('AIR123456')
  })

  it('parses Airtel Money with comma amount', () => {
    const sms = 'You have received Ksh 1,500 from GRACE WAMBUI 254798123456 via Airtel Money. Ref: AG789XYZ'
    const result = parseMpesaSMS(sms)
    expect(result?.amount).toBe(1500)
    expect(result?.payment_method).toBe('airtel_money')
  })
})

describe('parseMpesaSMS — Generic fallback', () => {
  it('parses a received message without known keywords', () => {
    const sms = 'received KSh 250 from UNKNOWN SENDER'
    const result = parseMpesaSMS(sms)
    expect(result).not.toBeNull()
    expect(result?.amount).toBe(250)
    expect(result?.payment_method).toBeUndefined()
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

describe('parseMpesaSMS — pattern priority', () => {
  it('Pochi (D) takes priority over generic received patterns', () => {
    const sms = 'You have received KSh 500 from JOHN DOE 254712345678 to Pochi la Biashara on 15/07/26 at 10:30'
    const result = parseMpesaSMS(sms)
    expect(result?.payment_method).toBe('pochi_la_biashara')
  })

  it('Paybill with Account (F) takes priority over Till (E)', () => {
    const sms = 'SHOP has received KSh 1,000 from JANE DOE 254712345678. Account ORD-123. Trans ABC'
    const result = parseMpesaSMS(sms)
    expect(result?.payment_method).toBe('paybill')
  })

  it('Airtel (G) takes priority over generic received', () => {
    const sms = 'received Ksh 300 from JAMES 254712345678 via Airtel Money. Ref: XYZ'
    const result = parseMpesaSMS(sms)
    expect(result?.payment_method).toBe('airtel_money')
  })
})
