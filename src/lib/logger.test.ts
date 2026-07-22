import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('logger', () => {
  let infoSpy: ReturnType<typeof vi.fn>
  let warnSpy: ReturnType<typeof vi.fn>
  let errorSpy: ReturnType<typeof vi.fn>
  let debugSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('info logs with [Daftari] prefix in dev', async () => {
    const { logger } = await import('./logger')
    logger.info('sync:started', { count: 5 })
    expect(infoSpy).toHaveBeenCalledWith('[Daftari] sync:started', { count: 5 })
  })

  it('info logs without data', async () => {
    const { logger } = await import('./logger')
    logger.info('nav:home')
    expect(infoSpy).toHaveBeenCalledWith('[Daftari] nav:home', '')
  })

  it('warn logs with [Daftari] prefix', async () => {
    const { logger } = await import('./logger')
    logger.warn('sms:fallback', { length: 120 })
    expect(warnSpy).toHaveBeenCalledWith('[Daftari] sms:fallback', { length: 120 })
  })

  it('warn logs without data', async () => {
    const { logger } = await import('./logger')
    logger.warn('degraded')
    expect(warnSpy).toHaveBeenCalledWith('[Daftari] degraded', '')
  })

  it('error logs Error objects with name and message', async () => {
    const { logger } = await import('./logger')
    const err = new Error('test failure')
    logger.error('dexie:write', err, { local_id: 'tx-1' })
    expect(errorSpy).toHaveBeenCalledWith(
      '[Daftari] dexie:write',
      expect.objectContaining({ name: 'Error', message: 'test failure', local_id: 'tx-1' })
    )
  })

  it('error logs non-Error values as { raw: String(value) }', async () => {
    const { logger } = await import('./logger')
    logger.error('unknown', 'string error')
    expect(errorSpy).toHaveBeenCalledWith(
      '[Daftari] unknown',
      expect.objectContaining({ raw: 'string error' })
    )
  })

  it('error logs without extra data', async () => {
    const { logger } = await import('./logger')
    logger.error('simple', new Error('boom'))
    expect(errorSpy).toHaveBeenCalled()
  })

  it('track logs with [Daftari] track: prefix', async () => {
    const { logger } = await import('./logger')
    logger.track('transaction:recorded', { amount: 500 })
    expect(debugSpy).toHaveBeenCalledWith(
      '[Daftari] track:transaction:recorded',
      { amount: 500 }
    )
  })

  it('track logs without data', async () => {
    const { logger } = await import('./logger')
    logger.track('app:mounted')
    expect(debugSpy).toHaveBeenCalledWith('[Daftari] track:app:mounted', '')
  })
})
