import { useState } from 'react';
import { ChevronLeft, Plus, Zap } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import TextField from '../components/ui/TextField';

interface BatchEntryScreenProps {
  onBack: () => void;
}

export default function BatchEntryScreen({ onBack }: BatchEntryScreenProps) {
  const { t } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    await addTransaction({
      local_id: crypto.randomUUID(),
      type,
      category: type === 'income' ? 'product_sale' : 'other',
      source: 'manual',
      amount: Number(amount),
      description: description.trim() || undefined,
      recorded_at: new Date().toISOString(),
      synced: 0,
    });
    setCount(c => c + 1);
    setAmount('');
    setDescription('');
    setSaving(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('batch_entry')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-3 mb-4">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> {t('batch_tip')}
          </p>
        </div>

        {count > 0 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-3 mb-4">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">{t('batch_count', { count })}</p>
          </div>
        )}

        <Card variant="subtle" padding="p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('batch_select_type')}</p>
              <div className="flex gap-2">
                <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${type === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-stone-900 text-muted dark:text-stone-400 border-border dark:border-stone-700'}`}>
                  {t('sale')}
                </button>
                <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${type === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-stone-900 text-muted dark:text-stone-400 border-border dark:border-stone-700'}`}>
                  {t('expense')}
                </button>
              </div>
            </div>

            <TextField type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('batch_amount')} accent="blue" className="text-base" />

            <TextField type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('batch_description')} accent="blue" className="text-base" />

            <div className="flex gap-2">
              <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('batch_done')}</button>
              <button onClick={handleAdd} disabled={!amount || Number(amount) <= 0 || saving} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> {t('batch_add')}</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
