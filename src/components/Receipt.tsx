import { useEffect, useState } from 'react';
import { Check, Printer, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import type { TranslationKey } from '../hooks/useTranslation';
import { track, EVENTS } from '../lib/analytics';

interface ReceiptProps {
  receiptId: string;
  amount: number;
  type: 'income' | 'expense' | 'withdrawal';
  description?: string;
  onDismiss: () => void;
  onShare?: () => void;
}

export default function Receipt({ receiptId, amount, type, description, onDismiss, onShare }: ReceiptProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    const enter = setTimeout(() => setPhase('visible'), 50);
    track(EVENTS.RECEIPT_VIEWED, { type, amount })
    return () => clearTimeout(enter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDismiss() {
    setPhase('exit');
    setTimeout(onDismiss, 200);
  }

  const labelKey = type === 'income' ? 'sale_recorded' : type === 'expense' ? 'expense_recorded' : 'withdrawal_recorded';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
      style={{
        backgroundColor: phase === 'enter' || phase === 'exit' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.5)',
        opacity: phase === 'exit' ? 0 : 1,
      }}
      onClick={handleDismiss}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden transition-all duration-200"
        style={{
          transform: phase === 'enter' ? 'scale(0.9) translateY(20px)' : phase === 'exit' ? 'scale(0.9)' : 'scale(1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <p className="text-lg font-bold text-green-700">{t(labelKey as TranslationKey)}</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            KES {amount.toLocaleString('en-KE')}
          </p>
          {receiptId && (
            <p className="text-xs font-mono text-muted dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
              {receiptId}
            </p>
          )}
          {description && (
            <p className="text-sm text-stone-600 dark:text-stone-300">{description}</p>
          )}
          <div className="w-full h-px bg-border dark:border-stone-700 my-1" />
          <div className="flex gap-3 w-full">
            {onShare && (
              <button
                onClick={onShare}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
              >
                <Printer className="w-4 h-4" /> {t('share') || 'Share'}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 flex items-center justify-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" /> {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
