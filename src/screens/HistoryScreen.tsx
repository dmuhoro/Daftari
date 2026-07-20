import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Search, X, SlidersHorizontal, FileDown, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { flushQueue } from '../features/sync/syncQueue';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { transactionsToCSV, downloadCSV } from '../lib/csv';
import type { Transaction } from '../lib/db';
import TransactionRow from '../components/history/TransactionRow';
import ReceiptSheet from '../components/history/ReceiptSheet';
import EditSheet from '../components/history/EditSheet';
import DeleteConfirmModal from '../components/history/DeleteConfirmModal';
import UndoSnackbar from '../components/history/UndoSnackbar';

const PAGE_SIZE = 50;

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Taslimu', en: 'Cash' },
  mpesa_send_money: { sw: 'M-Pesa', en: 'M-Pesa' },
  pochi_la_biashara: { sw: 'Pochi', en: 'Pochi' },
  till_number: { sw: 'Till', en: 'Till' },
  paybill: { sw: 'Paybill', en: 'Paybill' },
  airtel_money: { sw: 'Airtel', en: 'Airtel' },
  bank_transfer: { sw: 'Benki', en: 'Bank' },
};

const TYPE_OPTIONS: Array<{ key: string; sw: string; en: string }> = [
  { key: 'all', sw: 'Zote', en: 'All' },
  { key: 'income', sw: 'Mauzo', en: 'Sales' },
  { key: 'expense', sw: 'Gharama', en: 'Expenses' },
  { key: 'withdrawal', sw: 'Kutoa', en: 'Withdrawals' },
];

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
  const allTransactions = useStore((s) => s.transactions);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const { isOnline } = useOnlineStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [undoMsg, setUndoMsg] = useState<string | null>(null);
  const undoDataRef = useRef<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const tx of allTransactions) {
      if (tx.category) cats.add(tx.category);
    }
    return [...cats].sort();
  }, [allTransactions]);

  const allPaymentMethods = useMemo(() => {
    const pmts = new Set<string>();
    for (const tx of allTransactions) {
      if (tx.payment_method) pmts.add(tx.payment_method);
    }
    return [...pmts].sort();
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    const now = new Date(getNairobiISO());

    let result = [...allTransactions];

    if (filter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((tx) => new Date(tx.recorded_at) >= weekAgo);
    } else if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((tx) => new Date(tx.recorded_at) >= startOfMonth);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (tx) =>
          (tx.description && tx.description.toLowerCase().includes(q)) ||
          tx.amount.toString().includes(q) ||
          (tx.category && tx.category.toLowerCase().includes(q)) ||
          (tx.mpesa_sender && tx.mpesa_sender.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    if (categoryFilter) {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    if (paymentFilter) {
      result = result.filter((tx) => tx.payment_method === paymentFilter);
    }

    if (dateFrom) {
      result = result.filter((tx) => tx.recorded_at.slice(0, 10) >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((tx) => tx.recorded_at.slice(0, 10) <= dateTo);
    }

    return result;
  }, [allTransactions, filter, debouncedSearch, typeFilter, categoryFilter, paymentFilter, dateFrom, dateTo]);

  const sorted = useMemo(
    () => [...filteredTransactions].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()),
    [filteredTransactions]
  );

  const paginated = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page]);
  const hasMore = paginated.length < sorted.length;

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, categoryFilter, paymentFilter, dateFrom, dateTo, filter]);

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

  function openEditSheet(tx: Transaction) {
    setEditTx(tx);
    setEditingAmount(tx.amount.toString());
    setEditingDescription(tx.description || '');
    setEditingCategory(tx.category);
    setEditingDate(tx.recorded_at.slice(0, 10));
    setEditingTime(tx.recorded_at.slice(11, 16));
  }

  async function handleSaveEdit() {
    if (!editTx) return;
    const amount = parseInt(editingAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    const recorded_at = `${editingDate}T${editingTime}:00`;
    await updateTransaction(editTx.local_id, {
      amount,
      description: editingDescription || undefined,
      category: editingCategory,
      recorded_at,
    });
    setEditTx(null);
  }

  async function handleDelete(local_id: string) {
    const tx = allTransactions.find((t) => t.local_id === local_id);
    if (tx) undoDataRef.current = tx;
    await deleteTransaction(local_id);
    setDeleteConfirm(null);
    setUndoMsg(t('transaction_deleted') || 'Transaction deleted');
    setTimeout(() => {
      setUndoMsg(null);
      undoDataRef.current = null;
    }, 4000);
  }

  async function handleUndoDelete() {
    if (!undoDataRef.current) return;
    const tx = undoDataRef.current;
    await useStore.getState().addTransaction({
      local_id: tx.local_id,
      type: tx.type,
      category: tx.category,
      source: tx.source,
      amount: tx.amount,
      description: tx.description,
      recorded_at: tx.recorded_at,
      synced: 0,
      user_id: tx.user_id,
      mpesa_code: tx.mpesa_code,
      mpesa_sender: tx.mpesa_sender,
      payment_method: tx.payment_method,
      receipt_id: tx.receipt_id,
    });
    setUndoMsg(null);
    undoDataRef.current = null;
  }

  const filters: FilterTab[] = ['week', 'month', 'all'];

  function formatDate(dateStr: string) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return t('leo');
    if (dateStr === yesterday) return t('jana');
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (allTransactions.length === 0) {
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

  const groups = groupByDate(paginated);
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted dark:text-stone-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'sw' ? 'Tafuta kiasi, maelezo...' : 'Search amount, description...'}
            aria-label={t('search') || 'Search transactions'}
            className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 pl-10 pr-10 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}
        </div>

        {/* Filter tabs + filter toggle */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-label={f === 'week' ? (language === 'sw' ? 'Wiki hii' : 'This week') : f === 'month' ? (language === 'sw' ? 'Mwezi huu' : 'This month') : (language === 'sw' ? 'Zote' : 'All')}
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label={language === 'sw' ? 'Chuja' : 'Filter'}
            className={`p-2 rounded-xl transition-colors ${
              showFilters || typeFilter !== 'all' || categoryFilter || paymentFilter || dateFrom || dateTo
                ? 'bg-green-600 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const csv = transactionsToCSV(allTransactions);
              const filename = `daftari_${new Date().toISOString().slice(0, 10)}.csv`;
              downloadCSV(csv, filename);
            }}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title={language === 'sw' ? 'Pakua CSV' : 'Export CSV'}
          >
            <FileDown className="w-5 h-5" />
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-card p-4 flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTypeFilter(typeFilter === opt.key ? 'all' : opt.key)}
                    aria-label={opt.key === 'all' ? (language === 'sw' ? 'Onyesha miamala yote' : 'Show all transactions') : opt.key === 'income' ? (language === 'sw' ? 'Onyesha mauzo tu' : 'Show income only') : (language === 'sw' ? 'Onyesha gharama tu' : 'Show expenses only')}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      typeFilter === opt.key
                        ? 'bg-green-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {language === 'sw' ? opt.sw : opt.en}
                  </button>
              ))}
            </div>

            {allCategories.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('category')}</p>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">{language === 'sw' ? 'Zote' : 'All'}</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {allPaymentMethods.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('payment_method_label')}</p>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">{language === 'sw' ? 'Zote' : 'All'}</option>
                  {allPaymentMethods.map((pm) => (
                    <option key={pm} value={pm}>
                      {(language === 'sw' ? PAYMENT_LABELS[pm]?.sw : PAYMENT_LABELS[pm]?.en) ?? pm}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{language === 'sw' ? 'Kuanzia' : 'From'}</p>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{language === 'sw' ? 'Hadi' : 'To'}</p>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            <button
              onClick={() => { setTypeFilter('all'); setCategoryFilter(''); setPaymentFilter(''); setDateFrom(''); setDateTo(''); setSearchQuery(''); }}
              className="self-end text-xs font-medium text-primary-600 hover:underline"
            >
              {language === 'sw' ? 'Futa vichujio' : 'Clear filters'}
            </button>
          </div>
        )}

        {/* Count */}
        <p className="text-xs font-medium text-muted dark:text-stone-400">
          {filteredTransactions.length} {language === 'sw' ? 'miamala' : 'transactions'}
          {filteredTransactions.length !== allTransactions.length && (
            <span className="text-muted dark:text-stone-500">
              {' '}({allTransactions.length} {language === 'sw' ? 'jumla' : 'total'})
            </span>
          )}
        </p>

        {/* Transaction list */}
        {dates.map((date) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted dark:text-stone-400 uppercase tracking-widest mb-2 mt-2">
              {formatDate(date)}
            </p>
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-card overflow-hidden">
              {(groups[date] as Transaction[]).map((tx, i, arr) => (
                <TransactionRow
                  key={tx.local_id}
                  tx={tx}
                  isLast={i === arr.length - 1}
                  onSelect={setSelectedTx}
                  onEdit={openEditSheet}
                  onDelete={setDeleteConfirm}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Sentinel for infinite scroll */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {hasMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        )}

        {!hasMore && sorted.length > 0 && (
          <p className="text-center text-xs text-muted dark:text-stone-400 py-4">
            {language === 'sw' ? 'Mwisho wa miamala' : 'End of transactions'}
          </p>
        )}
      </div>

      {/* Undo snackbar */}
      {undoMsg && (
        <UndoSnackbar message={undoMsg} onUndo={handleUndoDelete} />
      )}

      {/* Receipt detail bottom sheet */}
      {selectedTx && !editTx && (
        <ReceiptSheet
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          onEdit={(tx) => { setSelectedTx(null); openEditSheet(tx); }}
        />
      )}

      {/* Edit transaction sheet */}
      {editTx && (
        <EditSheet
          tx={editTx}
          amount={editingAmount}
          description={editingDescription}
          category={editingCategory}
          date={editingDate}
          time={editingTime}
          onClose={() => setEditTx(null)}
          onAmountChange={setEditingAmount}
          onDescriptionChange={setEditingDescription}
          onCategoryChange={setEditingCategory}
          onDateChange={setEditingDate}
          onTimeChange={setEditingTime}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <DeleteConfirmModal
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}
    </div>
  );
}
