import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReceiptData } from './print'

function makeReceipt(overrides: Partial<ReceiptData> = {}): ReceiptData {
  return {
    businessName: 'Duka Bora',
    receiptId: 'RCP-001',
    amount: 1500,
    type: 'income',
    date: '2026-07-22T10:30:00Z',
    ...overrides,
  }
}

describe('formatReceiptText (print)', () => {
  let formatReceiptText: typeof import('./print').formatReceiptText

  beforeEach(async () => {
    const mod = await import('./print')
    formatReceiptText = mod.formatReceiptText
  })

  it('includes business name and receipt ID', () => {
    const result = formatReceiptText(makeReceipt())
    expect(result).toContain('Duka Bora')
    expect(result).toContain('RCP-001')
  })

  it('includes formatted amount with KES', () => {
    const result = formatReceiptText(makeReceipt({ amount: 2500 }))
    expect(result).toContain('KES 2,500')
  })

  it('includes date', () => {
    const result = formatReceiptText(makeReceipt())
    expect(result).toContain('2026')
  })

  it('includes customer name when provided', () => {
    const result = formatReceiptText(makeReceipt({ customerName: 'John Kamau' }))
    expect(result).toContain('Customer: John Kamau')
  })

  it('omits customer name when not provided', () => {
    const result = formatReceiptText(makeReceipt())
    expect(result).not.toContain('Customer:')
  })

  it('includes items when provided', () => {
    const result = formatReceiptText(makeReceipt({
      items: [
        { name: 'Unga', qty: 2, price: 500 },
        { name: 'Sugar', qty: 1, price: 200 },
      ],
    }))
    expect(result).toContain('Unga x2')
    expect(result).toContain('Sugar x1')
    expect(result).toContain('KES 500')
  })

  it('omits items section when not provided', () => {
    const result = formatReceiptText(makeReceipt())
    expect(result).not.toContain('x')
  })

  it('includes description when provided', () => {
    const result = formatReceiptText(makeReceipt({ description: 'Morning sale' }))
    expect(result).toContain('Morning sale')
  })

  it('omits description when not provided', () => {
    const result = formatReceiptText(makeReceipt())
    expect(result).not.toContain('Morning sale')
  })

  it('does not include payment method (only in ESC/POS)', () => {
    const result = formatReceiptText(makeReceipt({ paymentMethod: 'M-Pesa' }))
    expect(result).not.toContain('Payment:')
  })

  it('includes loyalty earned when provided', () => {
    const result = formatReceiptText(makeReceipt({ loyaltyEarned: 15 }))
    expect(result).toContain('Points earned: 15')
  })

  it('includes loyalty redeemed when provided', () => {
    const result = formatReceiptText(makeReceipt({ loyaltyRedeemed: 10 }))
    expect(result).toContain('Points redeemed: 10')
  })

  it('includes discount lines when discount provided', () => {
    const result = formatReceiptText(makeReceipt({ amount: 1500, discount: 200 }))
    expect(result).toContain('Subtotal: KES 1,700')
    expect(result).toContain('Discount: -KES 200')
    expect(result).toContain('TOTAL: KES 1,500')
  })

  it('does not show discount lines when no discount', () => {
    const result = formatReceiptText(makeReceipt({ amount: 1500 }))
    expect(result).not.toContain('Subtotal:')
    expect(result).not.toContain('Discount:')
  })

  it('always includes thank you message', () => {
    const result = formatReceiptText(makeReceipt())
    expect(result).toContain('Thank you!')
  })
})

describe('printBrowserReceipt', () => {
  let printBrowserReceipt: typeof import('./print').printBrowserReceipt
  let mockDocumentWrite: ReturnType<typeof vi.fn>
  let mockDocumentClose: ReturnType<typeof vi.fn>
  let mockPrint: ReturnType<typeof vi.fn>
  let mockOpen: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    mockDocumentWrite = vi.fn()
    mockDocumentClose = vi.fn()
    mockPrint = vi.fn()
    mockOpen = vi.fn()

    vi.stubGlobal('window', {
      open: mockOpen,
    })

    mockOpen.mockReturnValue({
      document: {
        write: mockDocumentWrite,
        close: mockDocumentClose,
      },
      print: mockPrint,
    })

    vi.useFakeTimers({ shouldAdvanceTime: true })

    const mod = await import('./print')
    printBrowserReceipt = mod.printBrowserReceipt
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens a new window', async () => {
    const receipt = makeReceipt()
    const promise = printBrowserReceipt(receipt)
    await vi.advanceTimersByTimeAsync(600)
    await promise

    expect(mockOpen).toHaveBeenCalledWith('', '_blank')
  })

  it('writes HTML with business name', async () => {
    const receipt = makeReceipt()
    const promise = printBrowserReceipt(receipt)
    await vi.advanceTimersByTimeAsync(600)
    await promise

    expect(mockDocumentWrite).toHaveBeenCalledWith(
      expect.stringContaining('Duka Bora')
    )
  })

  it('closes the document', async () => {
    const receipt = makeReceipt()
    const promise = printBrowserReceipt(receipt)
    await vi.advanceTimersByTimeAsync(600)
    await promise

    expect(mockDocumentClose).toHaveBeenCalled()
  })

  it('calls print()', async () => {
    const receipt = makeReceipt()
    const promise = printBrowserReceipt(receipt)
    await vi.advanceTimersByTimeAsync(600)
    await promise

    expect(mockPrint).toHaveBeenCalled()
  })

  it('returns early when window.open returns null', async () => {
    mockOpen.mockReturnValue(null)
    const receipt = makeReceipt()
    await printBrowserReceipt(receipt)

    expect(mockDocumentWrite).not.toHaveBeenCalled()
  })
})

describe('printBluetoothReceipt', () => {
  let printBluetoothReceipt: typeof import('./print').printBluetoothReceipt

  beforeEach(async () => {
    const mod = await import('./print')
    printBluetoothReceipt = mod.printBluetoothReceipt
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws when navigator.bluetooth is not available', async () => {
    vi.stubGlobal('navigator', {})
    await expect(printBluetoothReceipt(makeReceipt())).rejects.toThrow()
  })

  it('throws when device.gatt connect fails', async () => {
    vi.stubGlobal('navigator', {
      bluetooth: {
        requestDevice: vi.fn().mockResolvedValue({
          gatt: {
            connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
          },
        }),
      },
    })

    await expect(printBluetoothReceipt(makeReceipt())).rejects.toThrow('Connection failed')
  })

  it('throws when no writable characteristic found', async () => {
    vi.stubGlobal('navigator', {
      bluetooth: {
        requestDevice: vi.fn().mockResolvedValue({
          gatt: {
            connect: vi.fn().mockResolvedValue({
              getPrimaryService: vi.fn().mockResolvedValue({
                getCharacteristics: vi.fn().mockResolvedValue([
                  { properties: { write: false } },
                ]),
              }),
            }),
          },
        }),
      },
    })

    await expect(printBluetoothReceipt(makeReceipt())).rejects.toThrow('No writable characteristic')
  })

  it('calls writeValue on the writable characteristic', async () => {
    const writeValue = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      bluetooth: {
        requestDevice: vi.fn().mockResolvedValue({
          gatt: {
            connect: vi.fn().mockResolvedValue({
              getPrimaryService: vi.fn().mockResolvedValue({
                getCharacteristics: vi.fn().mockResolvedValue([
                  { properties: { write: true }, writeValue },
                ]),
              }),
            }),
          },
        }),
      },
    })

    await printBluetoothReceipt(makeReceipt())
    expect(writeValue).toHaveBeenCalledWith(expect.any(Uint8Array))
  })

  it('wraps non-Error exceptions in Error', async () => {
    vi.stubGlobal('navigator', {
      bluetooth: {
        requestDevice: vi.fn().mockRejectedValue('some string error'),
      },
    })

    await expect(printBluetoothReceipt(makeReceipt())).rejects.toThrow('Bluetooth print failed')
  })
})
