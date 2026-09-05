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
    toArray: vi.fn(() => Promise.resolve([])),
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
  transaction: vi.fn((...args: unknown[]) => {
    const callback = args[args.length - 1] as () => Promise<unknown>;
    return callback();
  }),
}

vi.mock('../lib/db', () => ({
  db: mockDb,
  default: mockDb,
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      signUp: vi.fn(async () => ({ data: {}, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: null, error: null })),
      then: vi.fn(async () => ({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(async () => {}),
    })),
    removeChannel: vi.fn(async () => {}),
  },
}))
