import { vi } from 'vitest'

const makeChain = () => ({
  modify: vi.fn(() => Promise.resolve()),
  first: vi.fn(() => Promise.resolve(undefined)),
  toArray: vi.fn(() => Promise.resolve([])),
  delete: vi.fn(() => Promise.resolve()),
  count: vi.fn(() => Promise.resolve(0)),
  reverse: vi.fn(() => ({
    first: vi.fn(() => Promise.resolve(null)),
    toArray: vi.fn(() => Promise.resolve([])),
  })),
})

export const mockWhere = () => vi.fn(() => ({
  equals: vi.fn(() => makeChain()),
  above: vi.fn(() => makeChain()),
}))

export const mockDb = {
  transactions: {
    add: vi.fn(() => Promise.resolve(1)),
    put: vi.fn(() => Promise.resolve()),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
      above: vi.fn(() => ({
        reverse: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
      between: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
      last: vi.fn(() => Promise.resolve(null)),
    })),
    where: mockWhere(),
    update: vi.fn(() => Promise.resolve()),
  },
  business: {
    add: vi.fn(() => Promise.resolve(1)),
    update: vi.fn(() => Promise.resolve()),
    toCollection: vi.fn(() => ({
      first: vi.fn(() => Promise.resolve(null)),
    })),
    toArray: vi.fn(() => Promise.resolve([])),
    where: mockWhere(),
  },
  customers: {
    add: vi.fn(() => Promise.resolve(1)),
    put: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
    })),
    where: mockWhere(),
    count: vi.fn(() => Promise.resolve(0)),
  },
  sync_queue: {
    add: vi.fn(() => Promise.resolve(1)),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    where: mockWhere(),
    count: vi.fn(() => Promise.resolve(0)),
  },
  daily_closes: {
    add: vi.fn(() => Promise.resolve(1)),
    put: vi.fn(() => Promise.resolve()),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
        first: vi.fn(() => Promise.resolve(null)),
      })),
    })),
    where: mockWhere(),
  },
  suppliers: {
    add: vi.fn(() => Promise.resolve(1)),
    put: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    count: vi.fn(() => Promise.resolve(0)),
    where: mockWhere(),
  },
  purchase_orders: {
    add: vi.fn(() => Promise.resolve(1)),
    put: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    where: mockWhere(),
  },
  stock_adjustments: {
    add: vi.fn(() => Promise.resolve(1)),
    put: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    where: mockWhere(),
  },
  open: vi.fn(() => Promise.resolve()),
}

vi.mock('../lib/db', () => ({
  db: mockDb,
  default: mockDb,
}))
