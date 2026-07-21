import { Pencil, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import TextField from '../ui/TextField';
import type { Transaction } from '../../lib/db';

interface EditSheetProps {
  tx: Transaction;
  amount: string;
  description: string;
  category: string;
  date: string;
  time: string;
  onClose: () => void;
  onAmountChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onSave: () => void;
}

export default function EditSheet({
  tx, amount, description, category, date, time,
  onClose, onAmountChange, onDescriptionChange, onCategoryChange, onDateChange, onTimeChange, onSave,
}: EditSheetProps) {
  const { t, language } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-stone-900 rounded-t-3xl w-full max-w-lg p-6 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-green-600" />
            <span className="text-base font-bold text-ink dark:text-stone-100">{language === 'sw' ? 'Hariri' : 'Edit'} {tx.type === 'income' ? t('sale') : tx.type === 'expense' ? t('expense') : t('withdrawal')}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-5 h-5 text-muted dark:text-stone-400" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('amount')}</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted dark:text-stone-400">KES</span>
              <TextField
                type="number"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className="pl-12 pr-4 font-semibold"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('description')}</p>
            <TextField
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              variant="inline"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('category')}</p>
            <TextField
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              variant="inline"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('leo')}</p>
              <TextField
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                variant="inline"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1">{t('time') || 'Time'}</p>
              <TextField
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                variant="inline"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border dark:border-stone-700 text-sm font-semibold text-ink dark:text-stone-100"
            >
              {t('cancel')}
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
