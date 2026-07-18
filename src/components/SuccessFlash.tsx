import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import type { TranslationKey } from '../hooks/useTranslation';

interface SuccessFlashProps {
  amount: number;
  type: 'income' | 'expense' | 'withdrawal';
  onDismiss: () => void;
}

export default function SuccessFlash({ amount, type, onDismiss }: SuccessFlashProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const enter = setTimeout(() => setPhase('hold'), 150);
    const hold = setTimeout(() => setPhase('exit'), 150 + 900);
    const exit = setTimeout(() => onDismiss(), 150 + 900 + 150);
    return () => { clearTimeout(enter); clearTimeout(hold); clearTimeout(exit); };
  }, [onDismiss]);

  const labelKey = type === 'income' ? 'sale_recorded' : type === 'expense' ? 'expense_recorded' : 'withdrawal_recorded';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150"
      style={{
        backgroundColor: 'rgba(250, 250, 245, 0.95)',
        opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        <p className="text-3xl font-bold text-stone-900">KES {amount.toLocaleString('en-KE')}</p>
        <p className="text-base font-medium text-green-700">{t(labelKey as TranslationKey)}</p>
      </div>
    </div>
  );
}
