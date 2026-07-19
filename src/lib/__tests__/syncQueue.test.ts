import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWhere = vi.fn();
const mockEquals = vi.fn();

vi.mock('../../lib/db', () => ({
  db: {
    sync_queue: {
      where: mockWhere.mockReturnThis(),
      equals: mockEquals.mockReturnThis(),
      count: vi.fn().mockResolvedValue(0),
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    transactions: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      modify: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('syncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export getPendingCount', async () => {
    const { getPendingCount } = await import('../../features/sync/syncQueue');
    const count = await getPendingCount();
    expect(typeof count).toBe('number');
    expect(mockWhere).toHaveBeenCalledWith('synced');
    expect(mockEquals).toHaveBeenCalledWith(0);
  });
});
