import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, ShoppingCart, Check, X, Package } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { db, type PurchaseOrder as POrder, type PurchaseOrderItem, type Supplier } from '../lib/db';

interface PurchaseOrdersScreenProps {
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function PurchaseOrdersScreen({ onBack }: PurchaseOrdersScreenProps) {
  const { t, language } = useTranslation();
  const activeBusinessId = useStore((s) => s.activeBusinessId);
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const products = business?.products ?? [];
  const [orders, setOrders] = useState<POrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [receiveId, setReceiveId] = useState<string | null>(null);

  const [selSupplierId, setSelSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);

  useEffect(() => {
    loadOrders();
    loadSuppliers();
  }, []);

  async function loadOrders() {
    const list = await db.purchase_orders
      .where('business_id').equals(activeBusinessId ?? '')
      .reverse()
      .toArray();
    setOrders(list);
  }

  async function loadSuppliers() {
    const list = await db.suppliers
      .where('business_id').equals(activeBusinessId ?? '')
      .toArray();
    setSuppliers(list);
  }

  function parseItems(po: POrder): PurchaseOrderItem[] {
    try { return JSON.parse(po.items) as PurchaseOrderItem[]; } catch { return []; }
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      draft: t('po_status_draft'),
      pending: t('po_status_pending'),
      partial: t('po_status_partial'),
      received: t('po_status_received'),
      cancelled: t('po_status_cancelled'),
    };
    return map[status] || status;
  }

  function addLineItem(productId: string) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    setPoItems(prev => [...prev, {
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      quantity_received: 0,
      unit_cost: p.cost_price || 0,
      total_cost: p.cost_price || 0,
    }]);
  }

  function updateLineItem(index: number, field: keyof PurchaseOrderItem, value: number | string) {
    setPoItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value as never };
      if (field === 'quantity' || field === 'unit_cost') {
        next[index].total_cost = next[index].quantity * next[index].unit_cost;
      }
      return next;
    });
  }

  function removeLineItem(index: number) {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  }

  function poTotal(): number {
    return poItems.reduce((s, i) => s + i.total_cost, 0);
  }

  async function handleCreatePO() {
    if (poItems.length === 0 || !activeBusinessId) return;
    const now = new Date().toISOString();
    const sup = suppliers.find(s => s.local_id === selSupplierId);
    await db.purchase_orders.add({
      local_id: crypto.randomUUID(),
      business_id: activeBusinessId,
      supplier_id: selSupplierId || undefined,
      supplier_name: sup?.name,
      status: 'pending',
      items: JSON.stringify(poItems),
      total_cost: poTotal(),
      notes: poNotes.trim() || undefined,
      created_at: now,
      updated_at: now,
      synced: 0,
    });
    setPoItems([]);
    setPoNotes('');
    setSelSupplierId('');
    setMode('list');
    await loadOrders();
  }

  async function handleReceive(poId: string) {
    const po = orders.find(o => o.local_id === poId);
    if (!po) return;
    const items = parseItems(po);
    const allReceived = items.every(i => i.quantity_received >= i.quantity);
    const newStatus = allReceived ? 'received' : 'partial';
    await db.purchase_orders.where('local_id').equals(poId).modify({ status: newStatus, updated_at: new Date().toISOString() });

    if (business) {
      const updated = [...products];
      for (const item of items) {
        const idx = updated.findIndex(p => p.id === item.product_id);
        if (idx >= 0) {
          const qtyToAdd = item.quantity - (item.quantity_received || 0);
          updated[idx] = { ...updated[idx], stock: (updated[idx].stock ?? 0) + qtyToAdd };
        } else {
          updated.push({ id: item.product_id, name: item.product_name, price: item.unit_cost, stock: item.quantity, cost_price: item.unit_cost });
        }
      }
      updateBusiness({ products: updated });
      const biz = await db.business.toCollection().first();
      if (biz?.id) {
        await db.business.update(biz.id, { products: JSON.stringify(updated) });
      }
    }

    setReceiveId(null);
    await loadOrders();
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={() => { setMode('list'); onBack(); }} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('purchase_orders')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {mode === 'create' ? (
          <div className="flex flex-col gap-4">
            {suppliers.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('po_supplier')}</p>
                <select value={selSupplierId} onChange={(e) => setSelSupplierId(e.target.value)} className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">--</option>
                  {suppliers.map(s => <option key={s.local_id} value={s.local_id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('my_products')}</p>
              {products.length === 0 ? (
                <p className="text-sm text-muted dark:text-stone-400">{t('no_products_settings')}</p>
              ) : (
                <select onChange={(e) => { if (e.target.value) { addLineItem(e.target.value); e.target.value = ''; } }} className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">{t('po_select_product')}...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — KES {p.cost_price || p.price}</option>)}
                </select>
              )}
            </div>

            {poItems.length > 0 && (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 overflow-hidden">
                {poItems.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center px-4 py-3 border-b border-border dark:border-stone-700 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-stone-100">{item.product_name}</p>
                      <div className="flex gap-2 mt-1">
                        <input type="number" value={item.quantity} onChange={(e) => updateLineItem(i, 'quantity', Number(e.target.value))} className="w-16 rounded-lg border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-2 py-1 text-xs text-ink dark:text-stone-100 text-center" min={1} />
                        <input type="number" value={item.unit_cost} onChange={(e) => updateLineItem(i, 'unit_cost', Number(e.target.value))} className="w-20 rounded-lg border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-2 py-1 text-xs text-ink dark:text-stone-100 text-center" min={0} />
                        <span className="text-xs text-muted dark:text-stone-400 self-center">KES {item.total_cost.toLocaleString('en-KE')}</span>
                      </div>
                    </div>
                    <button onClick={() => removeLineItem(i)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center flex-shrink-0"><X className="w-3.5 h-3.5 text-muted hover:text-red-500" /></button>
                  </div>
                ))}
                <div className="px-4 py-3 bg-stone-50 dark:bg-stone-800 flex justify-between">
                  <span className="text-xs font-semibold text-ink dark:text-stone-100">{t('po_total')}</span>
                  <span className="text-xs font-bold text-orange-600">KES {poTotal().toLocaleString('en-KE')}</span>
                </div>
              </div>
            )}

            <textarea value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder={t('po_notes')} rows={2} maxLength={200} className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none" />

            <div className="flex gap-2">
              <button onClick={() => { setMode('list'); setPoItems([]); setPoNotes(''); setSelSupplierId(''); }} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('cancel')}</button>
              <button onClick={handleCreatePO} disabled={poItems.length === 0} className="flex-1 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"><ShoppingCart className="w-4 h-4" /> {t('po_create')}</button>
            </div>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-muted dark:text-stone-400" />
                </div>
                <p className="text-sm text-muted dark:text-stone-400">{t('po_no_items')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.map((po) => {
                  const items = parseItems(po);
                  const isReceivable = po.status === 'pending' || po.status === 'partial';
                  return (
                    <div key={po.local_id} className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-sm px-4 py-3.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[po.status] || ''}`}>{statusLabel(po.status)}</span>
                            <span className="text-xs text-muted dark:text-stone-400">{new Date(po.created_at).toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE')}</span>
                          </div>
                          <p className="text-sm font-medium text-ink dark:text-stone-100 mt-1">{po.supplier_name || (language === 'sw' ? 'Muuzaji wa jumla' : 'General Supplier')}</p>
                          <p className="text-xs text-muted dark:text-stone-400">{items.length} {language === 'sw' ? 'bidhaa' : 'items'} · KES {po.total_cost.toLocaleString('en-KE')}</p>
                          {items.map((item, i) => (
                            <p key={i} className="text-xs text-muted dark:text-stone-400 mt-0.5">· {item.product_name} x{item.quantity}{item.quantity_received > 0 ? ` (received ${item.quantity_received})` : ''}</p>
                          ))}
                        </div>
                        {isReceivable && (
                          <button onClick={() => setReceiveId(po.local_id)} className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 flex-shrink-0"><Package className="w-3 h-3" /> {t('po_receive')}</button>
                        )}
                        {po.status === 'received' && (
                          <span className="text-xs font-medium text-green-600 flex items-center gap-1 flex-shrink-0"><Check className="w-3 h-3" /> {t('po_received_all')}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => setMode('create')} className="w-full py-4 rounded-2xl border-2 border-dashed border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:text-orange-600 hover:border-orange-300 transition-colors mt-4 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> {t('create_po')}
            </button>

            {receiveId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setReceiveId(null)}>
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-semibold text-ink dark:text-stone-100 mb-3">{t('po_confirm_receive')}</p>
                  <p className="text-xs text-muted dark:text-stone-400 mb-4">{language === 'sw' ? 'Bidhaa zitaongezwa kwenye stock' : 'Products will be added to stock'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setReceiveId(null)} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('cancel')}</button>
                    <button onClick={() => handleReceive(receiveId)} className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2"><Package className="w-4 h-4" /> {t('po_receive')}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
