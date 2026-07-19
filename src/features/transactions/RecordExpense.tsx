import { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { BUSINESS_CATEGORIES } from '../../lib/businessCategories';
import SuccessFlash from '../../components/SuccessFlash';
import { track, EVENTS } from '../../lib/analytics';

interface RecordExpenseProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function RecordExpense({ onSave, onCancel }: RecordExpenseProps) {
  const { t, language } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);
  const business = useStore((s) => s.business);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [flashAmount, setFlashAmount] = useState<number | null>(null);
  const [amountError, setAmountError] = useState('');

  const catKey = business?.category as keyof typeof BUSINESS_CATEGORIES | undefined;
  const expenseCats = catKey
    ? [...BUSINESS_CATEGORIES[catKey].expenseCategories, { key: 'other', sw: 'Nyingine', en: 'Other' }]
    : [{ key: 'ingredients', sw: 'Vifaa', en: 'Ingredients' }, { key: 'transport', sw: 'Usafiri', en: 'Transport' }, { key: 'other', sw: 'Nyingine', en: 'Other' }];

  if (!category && expenseCats.length > 0) {
    setCategory(expenseCats[0].key);
  }

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
      type: 'expense',
      category,
      source: 'manual',
      amount: Number(amount),
      description: description || undefined,
      recorded_at: new Date().toISOString(),
      synced: 0,
    });
    setSaving(false);
    setFlashAmount(Number(amount));
    track(EVENTS.TRANSACTION_RECORDED, { type: 'expense', method: 'manual' })
  }

  if (flashAmount !== null) {
    return <SuccessFlash amount={flashAmount} type="expense" onDismiss={onSave} />;
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <div>
        <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('amount')} (KES)</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
          onBlur={() => { if (amount) validateAmount(amount); }}
          placeholder="0"
          min="1"
          required
          className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-base text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
        />
        {amountError && <p className="text-red-500 text-sm mt-1">{amountError}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-2">{t('category')}</label>
        <div className="grid grid-cols-2 gap-2">
          {expenseCats.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                category === cat.key
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-stone-900 text-muted dark:text-stone-400 border-border dark:border-stone-700 hover:border-red-300 hover:text-red-600'
              }`}
            >
              {language === 'sw' ? cat.sw : cat.en}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">
          {t('description')} <span className="font-normal">({t('optional')})</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('description')}
          className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-base text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
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
          className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
