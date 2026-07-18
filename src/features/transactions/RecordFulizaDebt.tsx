import { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';

interface RecordFulizaDebtProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function RecordFulizaDebt({ onSave, onCancel }: RecordFulizaDebtProps) {
  const { t } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [amountError, setAmountError] = useState('');

  function validateAmount(val: string): boolean {
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0) {
      setAmountError(t('please_enter_valid_amount'));
      return false;
    }
    setAmountError('');
    return true;
  }

  async function handleSave() {
    if (!validateAmount(amount)) return;
    const num = Number(amount);

    setSaving(true);
    await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'debt_taken',
      category: 'fuliza',
      source: 'manual',
      amount: num,
      description: 'Fuliza debt taken',
      recorded_at: new Date().toISOString(),
      synced: 0,
    });
    setSaving(false);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onSave();
    }, 800);
  }

  if (flash) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary-600" />
        </div>
        <p className="text-base font-semibold text-ink dark:text-stone-100">{t('recorded')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink dark:text-stone-100">{t('chukua_fuliza')}</p>
          <p className="text-xs text-muted dark:text-stone-400">{t('fuliza')}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800">{t('withdrawal_warning')}</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('amount')} (KES)</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
          onBlur={() => { if (amount) validateAmount(amount); }}
          placeholder="0"
          className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3.5 text-2xl font-bold text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
          autoFocus
        />
        {amountError && <p className="text-red-500 text-sm mt-1">{amountError}</p>}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !amount || !!amountError}
          className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
