import { useState } from 'react';
import { CheckCircle, Zap } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';

interface RecordSaleProps {
  onSave: () => void;
  onCancel: () => void;
}

const SALE_CATEGORIES = ['chapati', 'bulk_order', 'other'] as const;

export default function RecordSale({ onSave, onCancel }: RecordSaleProps) {
  const { t } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('chapati');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  async function handleQuickSale() {
    setSaving(true);
    await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'income',
      category: 'chapati',
      source: 'manual',
      amount: 20,
      description: 'Chapati',
      recorded_at: new Date().toISOString(),
      synced: 0,
    });
    setSaving(false);
    setFlash(true);
    setTimeout(() => { setFlash(false); onSave(); }, 800);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'income',
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

  if (flash) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary-600" />
        </div>
        <p className="text-base font-semibold text-ink">{t('recorded')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-6">
      {/* Quick sale chip */}
      <button
        onClick={handleQuickSale}
        disabled={saving}
        className="flex items-center gap-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-2xl px-5 py-4 shadow-lg transition-colors disabled:opacity-60"
      >
        <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium text-primary-200">{t('quick_sale')}</span>
          <span className="text-sm font-bold">{t('quick_sale_label')}</span>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">au / or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
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
          <label className="block text-xs font-medium text-muted mb-1.5">{t('category')}</label>
          <div className="grid grid-cols-3 gap-2">
            {SALE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  category === cat
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-muted border-border hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                {t(`cat_${cat}` as 'cat_chapati' | 'cat_bulk_order' | 'cat_other')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">
            {t('description')} <span className="text-muted font-normal">({t('optional')})</span>
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
            className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
