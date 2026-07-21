import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import TextField from '../../components/ui/TextField';
import SuccessFlash from '../../components/SuccessFlash';
import { track, EVENTS } from '../../lib/analytics';

interface RecordWithdrawalProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function RecordWithdrawal({ onSave, onCancel }: RecordWithdrawalProps) {
  const { t } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [flashAmount, setFlashAmount] = useState<number | null>(null);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAmount(amount)) return;
    setSaving(true);
    await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'withdrawal',
      category: 'withdrawal',
      source: 'manual',
      amount: Number(amount),
      description: note || undefined,
      recorded_at: new Date().toISOString(),
      synced: 0,
    });
    setSaving(false);
    setFlashAmount(Number(amount));
    track(EVENTS.TRANSACTION_RECORDED, { type: 'withdrawal', method: 'manual' })
  }

  if (flashAmount !== null) {
    return <SuccessFlash amount={flashAmount} type="withdrawal" onDismiss={onSave} />;
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
          {t('withdrawal_warning')}
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('amount')} (KES)</label>
        <TextField
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
          onBlur={() => { if (amount) validateAmount(amount); }}
          placeholder="0"
          min="1"
          required
          accent="primary"
          className="text-base"
        />
        {amountError && <p className="text-red-500 text-sm mt-1">{amountError}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">
          {t('note')} <span className="font-normal">({t('optional')})</span>
        </label>
        <TextField
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('note')}
          maxLength={200}
          accent="primary"
          className="text-base"
        />
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
          type="submit"
          disabled={saving || !amount || !!amountError}
          className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
