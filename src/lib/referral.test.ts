import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockTrack = vi.fn()
vi.mock('./analytics', () => ({
  track: (...args: any[]) => mockTrack(...args),
  EVENTS: { REFERRAL_LINK_SHARED: 'referral_link_shared' },
}))

describe('generateReferralUrl', () => {
  let generateReferralUrl: typeof import('./referral').generateReferralUrl

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./referral')
    generateReferralUrl = mod.generateReferralUrl
  })

  it('generates URL with first 4 chars of business name as ref code', () => {
    const url = generateReferralUrl('Duka Bora')
    expect(url).toContain('ref=duka')
    expect(url).toContain('utm_source=referral')
    expect(url).toContain('utm_medium=whatsapp')
  })

  it('includes canonical domain', () => {
    const url = generateReferralUrl('Test')
    expect(url).toMatch(/^https?:\/\//)
  })

  it('includes category param when provided', () => {
    const url = generateReferralUrl('Duka Bora', 'grocery')
    expect(url).toContain('cat=grocery')
  })

  it('omits category param when not provided', () => {
    const url = generateReferralUrl('Duka Bora')
    expect(url).not.toContain('cat=')
  })

  it('lowercases the ref code', () => {
    const url = generateReferralUrl('DUKA')
    expect(url).toContain('ref=duka')
  })

  it('handles short business names', () => {
    const url = generateReferralUrl('Ab')
    expect(url).toContain('ref=ab')
  })
})

describe('shareViaWhatsApp', () => {
  let shareViaWhatsApp: typeof import('./referral').shareViaWhatsApp
  let openSpy: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    openSpy = vi.fn()
    vi.stubGlobal('window', { open: openSpy })

    const mod = await import('./referral')
    shareViaWhatsApp = mod.shareViaWhatsApp
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens WhatsApp with Swahili message when language=sw', () => {
    shareViaWhatsApp('https://daftari.app?ref=test', 'sw')
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank'
    )
    const url = openSpy.mock.calls[0][0]
    expect(url).toContain(encodeURIComponent('Nimepata programu nzuri'))
  })

  it('opens WhatsApp with English message when language=en', () => {
    shareViaWhatsApp('https://daftari.app?ref=test', 'en')
    const url = openSpy.mock.calls[0][0]
    expect(url).toContain(encodeURIComponent('Found a great business app'))
  })

  it('includes the referral URL in the message', () => {
    shareViaWhatsApp('https://daftari.app?ref=duka', 'en')
    const url = openSpy.mock.calls[0][0]
    expect(url).toContain(encodeURIComponent('https://daftari.app?ref=duka'))
  })

  it('tracks the referral link shared event', () => {
    shareViaWhatsApp('https://daftari.app?ref=test', 'en')
    expect(mockTrack).toHaveBeenCalledWith('referral_link_shared', { url: 'https://daftari.app?ref=test' })
  })
})
