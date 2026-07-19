import { useState, useEffect } from 'react';
import { ChevronLeft, Package, Plus, ClipboardList } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { db, type StockAdjustment } from '../lib/db';

interface StockAdjustmentsScreenProps {
  onBack: () => void;
}

const REASONS = ['restock', 'wastage', 'spoilage', 'damage', 'theft', 'count_correction', 'return', 'other'] as const;

export default function StockAdjustmentsScreen({ onBack }: StockAdjustmentsScreenProps) {
  const { t, language } = useTranslation();
  const activeBusinessId = useStore((s) => s.activeBusinessId);
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const products = business?.products ?? [];
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selProductId, setSelProductId] = useState('');
  const [changeQty, setChangeQty] = useState('');
  const [reason, setReason] = useState<string>('count_correction');
  const [adjNotes, setAdjNotes] = useState('');

  useEffect(() => {
    loadAdjustments();
  }, []);

  async function loadAdjustments() {
    const list = await db.stock_adjustments
      .where('business_id').equals(activeBusinessId ?? '')
      .reverse()
      .toArray();
    setAdjustments(list);
  }

  const selectedProduct = products.find(p => p.id === selProductId);
  const currentStock = selectedProduct?.stock ?? 0;
  const newStock = changeQty ? currentStock + Number(changeQty) : currentStock;

  const REASON_LABELS: Record<string, string> = {
    restock: language === 'sw' ? 'Kujaza tena' : 'Restock',
    wastage: language === 'sw' ? 'Upotevu' : 'Wastage',
    spoilage: language === 'sw' ? 'Kuharibika' : 'Spoilage',
    damage: language === 'sw' ? 'Kuvunjika' : 'Damage',
    theft: language === 'sw' ? 'Wizi' : 'Theft',
    count_correction: language === 'sw' ? 'Sahihisha hesabu' : 'Count Correction',
    return: language === 'sw' ? 'Kurudishwa' : 'Return',
    other: language === 'sw' ? 'Nyingine' : 'Other',
  };

  function reasonLabel(r: string): string {
    return REASON_LABELS[r] || r;
  }

  async function handleSave() {
    if (!selProductId || !changeQty || !activeBusinessId) return;
    const p = products.find(x => x.id === selProductId);
    if (!p) return;
    const now = new Date().toISOString();
    await db.stock_adjustments.add({
      local_id: crypto.randomUUID(),
      business_id: activeBusinessId,
      product_id: p.id,
      product_name: p.name,
      quantity_change: Number(changeQty),
      reason: reason as StockAdjustment['reason'],
      reason_text: reasonLabel(reason),
      notes: adjNotes.trim() || undefined,
      created_at: now,
      synced: 0,
    });

    const updatedProducts = products.map(pr =>
      pr.id === p.id ? { ...pr, stock: Math.max(0, (pr.stock ?? 0) + Number(changeQty)) } : pr
    );
    updateBusiness({ products: updatedProducts });
    const biz = await db.business.toCollection().first();
    if (biz?.id) {
      await db.business.update(biz.id, { products: JSON.stringify(updatedProducts) });
    }

    setSelProductId(''); setChangeQty(''); setReason('count_correction'); setAdjNotes('');
    setShowForm(false);
    await loadAdjustments();
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('stock_adjustments')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showForm ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-sm p-4">
            <div className="flex flex-col gap-3">
              <select value={selProductId} onChange={(e) => setSelProductId(e.target.value)} className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">{t('po_select_product')}...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.stock !== undefined ? ` (stock: ${p.stock})` : ''}</option>)}
              </select>

              {selectedProduct && (
                <p className="text-xs text-muted dark:text-stone-400">{t('stock_current')}: <span className="font-semibold text-ink dark:text-stone-100">{currentStock}</span> → {t('stock_new')}: <span className={`font-semibold ${newStock >= 0 ? 'text-green-600' : 'text-red-500'}`}>{newStock}</span></p>
              )}

              <input type="number" value={changeQty} onChange={(e) => setChangeQty(e.target.value)} placeholder={t('stock_change_qty')} className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />

              <div>
                <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('category')}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {REASONS.map(r => (
                    <button key={r} type="button" onClick={() => setReason(r)} className={`py-2 rounded-lg text-xs font-medium border transition-colors ${reason === r ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-stone-900 text-muted dark:text-stone-400 border-border dark:border-stone-700'}`}>
                      {reasonLabel(r)}
                    </button>
                  ))}
                </div>
              </div>

              <textarea value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} placeholder={t('stock_adjust_notes')} rows={2} maxLength={200} className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" />

              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setSelProductId(''); setChangeQty(''); }} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('cancel')}</button>
                <button onClick={handleSave} disabled={!selProductId || !changeQty} aria-label={t('stock_adjust_save') || 'Save adjustment'} className="flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"><ClipboardList className="w-4 h-4" /> {t('stock_adjust_save')}</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {adjustments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <ClipboardList className="w-7 h-7 text-muted dark:text-stone-400" />
                </div>
                <p className="text-sm text-muted dark:text-stone-400">{language === 'sw' ? 'Hakuna marekebisho ya stock bado' : 'No stock adjustments yet'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {adjustments.map((a) => (
                  <div key={a.local_id} className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-sm px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink dark:text-stone-100">{a.product_name}</p>
                        <p className="text-xs text-muted dark:text-stone-400 mt-0.5">
                          <span className={a.quantity_change >= 0 ? 'text-green-600' : 'text-red-500'}>{a.quantity_change >= 0 ? '+' : ''}{a.quantity_change}</span>
                          {' · '}{a.reason_text}
                          {' · '}{new Date(a.created_at).toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE')}
                        </p>
                        {a.notes && <p className="text-xs text-muted dark:text-stone-400 mt-0.5">{a.notes}</p>}
                      </div>
                      <Package className="w-4 h-4 text-muted dark:text-stone-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:text-amber-600 hover:border-amber-300 transition-colors mt-4 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> {t('stock_adjust')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
