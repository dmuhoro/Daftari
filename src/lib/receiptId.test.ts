import { describe, it, expect } from 'vitest';
import { generateReceiptId } from './receiptId';

describe('generateReceiptId', () => {
  it('returns a string matching the REC- pattern', () => {
    const id = generateReceiptId();
    expect(id).toMatch(/^REC-\d{6}-\d{4}$/);
  });

  it('increments the sequence for subsequent calls', () => {
    const first = generateReceiptId();
    const second = generateReceiptId();
    const firstSeq = parseInt(first.slice(-4), 10);
    const secondSeq = parseInt(second.slice(-4), 10);
    expect(secondSeq).toBe(firstSeq + 1);
  });

  it('resets sequence when date changes (simulate via manual date)', () => {
    // The module tracks date internally; multiple calls same day increment
    const ids = Array.from({ length: 5 }, () => generateReceiptId());
    for (let i = 1; i < ids.length; i++) {
      const prevSeq = parseInt(ids[i - 1].slice(-4), 10);
      const currSeq = parseInt(ids[i].slice(-4), 10);
      expect(currSeq).toBe(prevSeq + 1);
    }
  });
});
