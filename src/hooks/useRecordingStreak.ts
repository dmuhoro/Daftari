import { useState, useEffect } from 'react';
import { getDailyClosesByBusinessId } from '../lib/repository';
import { useStore } from '../lib/store';
import { track, EVENTS } from '../lib/analytics';
import { nowInNairobi, todayNairobi } from '../lib/dates';

export function useRecordingStreak() {
  const [streak, setStreak] = useState(0);
  const [lastCloseDate, setLastCloseDate] = useState<string | null>(null);
  const transactions = useStore((s) => s.transactions);
  const activeBusinessId = useStore((s) => s.activeBusinessId);

  useEffect(() => {
    if (!activeBusinessId) return;
    async function compute() {
      const closeResult = await getDailyClosesByBusinessId(activeBusinessId!);
      const closes = closeResult.ok ? closeResult.value.reverse() : [];
      const closeDates = new Set(closes.map((c) => c.date));

      let count = 0;
      const nairobi = nowInNairobi();
      const todayStr = todayNairobi();

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
  }, [transactions, activeBusinessId]);

  return { streak, lastCloseDate };
}
