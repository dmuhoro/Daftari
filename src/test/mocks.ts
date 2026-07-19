import { vi } from 'vitest'

export const mockDb = {
  transactions: {
    add: vi.fn(),
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
    })),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        modify: vi.fn(() => Promise.resolve()),
        first: vi.fn(() => Promise.resolve(undefined)),
        toArray: vi.fn(() => Promise.resolve([])),
      })),
      above: vi.fn(() => ({
        reverse: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    update: vi.fn(() => Promise.resolve()),
  },
  business: {
    add: vi.fn(() => Promise.resolve(1)),
    update: vi.fn(() => Promise.resolve()),
    toCollection: vi.fn(() => ({
      first: vi.fn(() => Promise.resolve(null)),
    })),
  },
  customers: {
    add: vi.fn(() => Promise.resolve(1)),
    update: vi.fn(() => Promise.resolve()),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
    })),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve(undefined)),
      })),
    })),
    count: vi.fn(() => Promise.resolve(0)),
  },
  sync_queue: {
    add: vi.fn(() => Promise.resolve(1)),
    update: vi.fn(() => Promise.resolve()),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
  daily_closes: {
    add: vi.fn(() => Promise.resolve(1)),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
  open: vi.fn(() => Promise.resolve()),
}

vi.mock('../lib/db', () => ({
  db: mockDb,
  default: mockDb,
}))
