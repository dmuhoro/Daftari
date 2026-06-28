import { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';

interface RecordExpenseProps {
  onSave: () => void;
  onCancel: () => void;
}

const EXPENSE_CATEGORIES = ['ingredients', 'transport', 'utilities', 'debt', 'other'] as const;
type ExpenseCat = typeof EXPENSE_CATEGORIES[number];

export default function RecordExpense({ onSave, onCancel }: RecordExpenseProps) {
  const { t } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCat>('ingredients');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
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
    onSave();
  }

  const catKey = (cat: ExpenseCat) =>
    `cat_${cat}` as 'cat_ingredients' | 'cat_transport' | 'cat_utilities' | 'cat_debt' | 'cat_other';

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">{t('amount')} (KES)</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min="1"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-2">{t('category')}</label>
        <div className="grid grid-cols-2 gap-2">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                category === cat
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-muted border-border hover:border-red-300 hover:text-red-600'
              }`}
            >
              {t(catKey(cat))}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">
          {t('description')} <span className="font-normal">({t('optional')})</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('description')}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:bg-gray-50 transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={saving || !amount}
          className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
