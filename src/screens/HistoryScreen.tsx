import { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, ArrowDownCircle, ClipboardList, Loader2, Smartphone, Wallet, Store, Building2, Wifi, Banknote } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { flushQueue } from '../features/sync/syncQueue';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const PAYMENT_ICONS: Record<string, typeof Smartphone> = {
  cash: Banknote,
  mpesa_send_money: Smartphone,
  pochi_la_biashara: Wallet,
  till_number: Store,
  paybill: Building2,
  airtel_money: Wifi,
  bank_transfer: Wallet,
};

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Taslimu', en: 'Cash' },
  mpesa_send_money: { sw: 'M-Pesa', en: 'M-Pesa' },
  pochi_la_biashara: { sw: 'Pochi', en: 'Pochi' },
  till_number: { sw: 'Till', en: 'Till' },
  paybill: { sw: 'Paybill', en: 'Paybill' },
  airtel_money: { sw: 'Airtel', en: 'Airtel' },
  bank_transfer: { sw: 'Benki', en: 'Bank' },
};

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

function groupByDate(txs: { recorded_at: string }[]) {
  const groups: Record<string, typeof txs> = {};
  for (const tx of txs) {
    const date = tx.recorded_at.slice(0, 10);
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  }
  return groups;
}

function getNairobiISO() {
  const now = new Date();
  const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
  return nairobi.toISOString();
}

type FilterTab = 'week' | 'month' | 'all';

export default function HistoryScreen() {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const { isOnline } = useOnlineStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [filter, setFilter] = useState<FilterTab>('all');
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) return;
    setRefreshing(true);
    await flushQueue();
    setRefreshing(false);
  }, [isOnline]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      const el = container;
      if (el && el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (startY.current === 0) return;
      if (!container) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0 && container.scrollTop === 0) {
        setPullY(Math.min(diff, 80));
      }
    }

    function handleTouchEnd() {
      if (pullY > 60 && isOnline) {
        handleRefresh();
      }
      setPullY(0);
      startY.current = 0;
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullY, isOnline, handleRefresh]);

  // Filter transactions
  const filteredTransactions = (() => {
    const now = new Date(getNairobiISO());

    if (filter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transactions.filter((tx) => new Date(tx.recorded_at) >= weekAgo);
    }

    if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return transactions.filter((tx) => new Date(tx.recorded_at) >= startOfMonth);
    }

    return transactions;
  })();

  const filters: FilterTab[] = ['week', 'month', 'all'];

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-2 pb-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-card p-8 flex flex-col items-center justify-center gap-3 mt-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-primary-400" />
          </div>
          <p className="text-base font-semibold text-ink dark:text-stone-100">{t('no_transactions_history')}</p>
          <p className="text-sm text-muted dark:text-stone-400 text-center">{t('transactions_will_appear')}</p>
        </div>
      </div>
    );
  }

  const sorted = [...filteredTransactions].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const groups = groupByDate(sorted);
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  function typeIcon(type: string) {
    if (type === 'income') return TrendingUp;
    if (type === 'expense') return TrendingDown;
    return ArrowDownCircle;
  }

  function typeColor(type: string) {
    if (type === 'income') return 'text-primary-600';
    if (type === 'expense') return 'text-danger';
    return 'text-amber-500';
  }

  function typeBg(type: string) {
    if (type === 'income') return 'bg-primary-50';
    if (type === 'expense') return 'bg-red-50';
    return 'bg-amber-50';
  }

  function typeLabel(type: string) {
    if (type === 'income') return t('sale');
    if (type === 'expense') return t('expense');
    return t('withdrawal');
  }

  function formatDate(dateStr: string) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return t('leo');
    if (dateStr === yesterday) return t('jana');
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-h-full"
      style={{ transform: `translateY(${pullY * 0.3}px)` }}
    >
      {(pullY > 20 || refreshing) && (
        <div className="flex items-center justify-center py-3 text-primary-600">
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div
              className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"
              style={{ transform: `rotate(${pullY * 2}deg)` }}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {f === 'week' ? t('filter_this_week') : f === 'month' ? t('filter_this_month') : t('filter_all')}
            </button>
          ))}
        </div>

        {dates.map((date) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted dark:text-stone-400 uppercase tracking-widest mb-2 mt-2">
              {formatDate(date)}
            </p>
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-card overflow-hidden">
              {(groups[date] as typeof sorted).map((tx, i, arr) => {
                const Icon = typeIcon(tx.type);
                const color = typeColor(tx.type);
                const bg = typeBg(tx.type);
                const isLast = i === arr.length - 1;
                const PayIcon = tx.payment_method ? PAYMENT_ICONS[tx.payment_method] : null;
                return (
                  <div key={tx.local_id}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">
                          {tx.description || typeLabel(tx.type)}
                        </p>
                        <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1">
                          {tx.category}
                          {PayIcon && tx.payment_method && (
                            <>
                              <span>·</span>
                              <PayIcon className="w-3 h-3" />
                              <span>{(language === 'sw' ? PAYMENT_LABELS[tx.payment_method]?.sw : PAYMENT_LABELS[tx.payment_method]?.en) ?? tx.payment_method}</span>
                            </>
                          )}
                          <span>·</span>
                          {new Date(tx.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${color} flex-shrink-0`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </p>
                    </div>
                    {!isLast && <div className="h-px bg-border mx-4" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
