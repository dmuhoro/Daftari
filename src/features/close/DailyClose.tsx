import { useState } from 'react';
import { X, CheckCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { db } from '../../lib/db';
import { track, EVENTS } from '../../lib/analytics';

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

function getTodayNairobi(): string {
  const now = new Date();
  const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
  return nairobi.toISOString().slice(0, 10);
}

interface DailyCloseProps {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

export default function DailyClose({ visible, onClose, onDismiss }: DailyCloseProps) {
  const { t } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const setLastCloseDate = useStore((s) => s.setLastCloseDate);
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  const todayStr = getTodayNairobi();
  const todayTxs = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === todayStr);

  const revenue = todayTxs
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = todayTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const profit = revenue - expenses;

  async function handleClose() {
    setSaving(true);
    await db.daily_closes.add({
      date: todayStr,
      profit,
      revenue,
      expenses,
      created_at: new Date().toISOString(),
    });
    setLastCloseDate(todayStr);
    setSaving(false);
    onClose();
    track(EVENTS.DAILY_CLOSE_COMPLETED, { profit, revenue, expenses })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-t-3xl shadow-xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-ink dark:text-stone-100">{t('funga_siku')}</h2>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-stone-900 rounded-2xl p-4 mb-4">
            <p className="text-xs text-muted dark:text-stone-400 mb-3">{t('funga_summary')}</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-muted dark:text-stone-400">{t('revenue')}</span>
                </div>
                <span className="text-base font-semibold text-primary-600">{fmtKES(revenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-danger" />
                  <span className="text-sm text-muted dark:text-stone-400">{t('expenses')}</span>
                </div>
                <span className="text-base font-semibold text-danger">{fmtKES(expenses)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-ink dark:text-stone-100" />
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('profit')}</span>
                </div>
                <span className={`text-lg font-bold ${profit >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                  {fmtKES(profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
              <button
                onClick={() => { track(EVENTS.DAILY_CLOSE_DISMISSED); onDismiss() }}
                className="flex-1 py-3.5 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors"
              >
                {t('baadaye')}
              </button>
            <button
              onClick={handleClose}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t('funga')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
