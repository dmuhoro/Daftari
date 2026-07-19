import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useStore } from '../lib/store';
import { track, EVENTS } from '../lib/analytics';

export function useRecordingStreak() {
  const [streak, setStreak] = useState(0);
  const [lastCloseDate, setLastCloseDate] = useState<string | null>(null);
  const transactions = useStore((s) => s.transactions);

  useEffect(() => {
    async function compute() {
      const closes = await db.daily_closes.orderBy('date').reverse().toArray();
      const closeDates = new Set(closes.map((c) => c.date));

      let count = 0;
      const today = new Date();
      const nairobi = new Date(today.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
      const todayStr = nairobi.toISOString().slice(0, 10);

      // Check if there are transactions today (partial day counts)
      const hasTodayTransactions = transactions.some((tx) => tx.recorded_at.slice(0, 10) === todayStr);

      // Walk backwards from today
      for (let i = 0; i < 365; i++) {
        const d = new Date(nairobi);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        if (i === 0) {
          // Today: if no close today but has transactions, count partial
          if (closeDates.has(dateStr) || hasTodayTransactions) {
            count++;
          } else {
            break;
          }
        } else {
          if (closeDates.has(dateStr)) {
            count++;
          } else {
            break;
          }
        }
      }

      setStreak(count);
      setLastCloseDate(closeDates.size > 0 ? [...closeDates].sort().pop() ?? null : null);

      if (count > 0 && count % 7 === 0) {
        track(EVENTS.STREAK_MILESTONE, { days: count })
      }
    }

    compute();
  }, [transactions]);

  return { streak, lastCloseDate };
}
