import { Receipt, Pencil, X, Hash, TrendingUp, TrendingDown, ArrowDownCircle, ClipboardList, User, Smartphone } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Transaction } from '../../lib/db';

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

interface ReceiptSheetProps {
  tx: Transaction;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
}

export default function ReceiptSheet({ tx, onClose, onEdit }: ReceiptSheetProps) {
  const { t } = useTranslation();
  const IconComponent = typeIcon(tx.type);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-stone-900 rounded-t-3xl w-full max-w-lg p-6 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-600" />
            <span className="text-base font-bold text-ink dark:text-stone-100">{t('receipt') || 'Receipt'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); onEdit(tx); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Pencil className="w-4 h-4 text-muted" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800">
              <X className="w-5 h-5 text-muted dark:text-stone-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl font-black text-green-600">D</span>
            </div>
          </div>

          {tx.receipt_id && (
            <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 dark:bg-stone-800 rounded-2xl">
              <Hash className="w-5 h-5 text-muted dark:text-stone-400" />
              <div>
                <p className="text-xs text-muted dark:text-stone-400">{t('receipt_no') || 'Receipt No.'}</p>
                <p className="text-sm font-mono font-bold text-ink dark:text-stone-100">{tx.receipt_id}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center py-2">
            <p className={`text-3xl font-bold ${typeColor(tx.type)}`}>
              {tx.type === 'income' ? '+' : '-'}{'KES '}{tx.amount.toLocaleString('en-KE')}
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <IconComponent className={`w-4 h-4 ${typeColor(tx.type)}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted dark:text-stone-400">{t('type') || 'Type'}</p>
                <p className="text-sm font-medium text-ink dark:text-stone-100">{tx.type === 'income' ? t('sale') : tx.type === 'expense' ? t('expense') : t('withdrawal')}</p>
              </div>
            </div>

            {tx.description && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-muted dark:text-stone-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted dark:text-stone-400">{t('description')}</p>
                  <p className="text-sm font-medium text-ink dark:text-stone-100">{tx.description}</p>
                </div>
              </div>
            )}

            {tx.mpesa_sender && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-muted dark:text-stone-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted dark:text-stone-400">{t('sender')}</p>
                  <p className="text-sm font-medium text-ink dark:text-stone-100">{tx.mpesa_sender}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-muted dark:text-stone-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted dark:text-stone-400">{t('time') || 'Time'}</p>
                <p className="text-sm font-medium text-ink dark:text-stone-100">
                  {new Date(tx.recorded_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
