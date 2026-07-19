import { useState } from 'react';
import { Package, Plus, Trash2, ChevronLeft, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { BUSINESS_CATEGORIES } from '../lib/businessCategories';

interface LocalProduct {
  id: string;
  name: string;
  price: number;
  unit?: string;
  stock?: number;
  low_stock_threshold?: number;
  barcode?: string;
}

interface ProductCatalogScreenProps {
  onBack: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export default function ProductCatalogScreen({ onBack }: ProductCatalogScreenProps) {
  const { t } = useTranslation();
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const products = business?.products ?? [];

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');

  const catKey = business?.category as keyof typeof BUSINESS_CATEGORIES | undefined;
  const category = catKey ? BUSINESS_CATEGORIES[catKey] : null;
  const subKey = business?.subcategory as string | undefined;
  const templateProducts = category && subKey
    ? (category as unknown as { templateProducts?: Record<string, Array<{ name: string; price: number; unit: string }>> }).templateProducts?.[subKey]
    : undefined;

  async function persistProducts(updated: LocalProduct[]) {
    updateBusiness({ products: updated });
    try {
      const biz = await db.business.toCollection().first();
      if (biz?.id) {
        await db.business.update(biz.id, { products: JSON.stringify(updated) });
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('daftari_businesses').upsert({
          owner_id: user.id,
          products: updated,
        }, { onConflict: 'owner_id' });
      }
    } catch (e) { console.warn('Failed to sync products to cloud:', e); }
  }

  async function addProduct(name: string, price: number, unit: string, stock?: number, threshold?: number) {
    if (!business) return;
    const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing && !confirm(`A product named '${name}' already exists. Add anyway?`)) {
      return;
    }
    const newProduct: LocalProduct = { id: generateId(), name, price, unit, stock, low_stock_threshold: threshold };
    const updated = [...products, newProduct];
    await persistProducts(updated);
  }

  async function deleteProduct(id: string) {
    const updated = products.filter((p) => p.id !== id);
    await persistProducts(updated);
    setDeleteConfirm(null);
  }

  async function handleRestock(id: string, qty: number) {
    const updated = products.map((p) =>
      p.id === id ? { ...p, stock: (p.stock ?? 0) + qty } : p
    );
    await persistProducts(updated);
    setRestockId(null);
    setRestockQty('');
  }

  async function handleAddFromTemplates() {
    if (!templateProducts) return;
    for (const tp of templateProducts) {
      if (!products.some((p) => p.name === tp.name)) {
        await addProduct(tp.name, tp.price, tp.unit, 0, 5);
      }
    }
  }

  function isLowStock(p: LocalProduct): boolean {
    if (p.stock === undefined) return false;
    const threshold = p.low_stock_threshold ?? 5;
    return p.stock <= threshold;
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('my_products')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {products.length === 0 && templateProducts && !showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-medium text-blue-800 mb-2">{t('add_from_templates')}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {templateProducts.map((tp, i) => (
                <span key={i} className="text-xs bg-white dark:bg-stone-900 rounded-full px-3 py-1 text-blue-700 border border-blue-200">
                  {tp.name} — KES {tp.price}
                </span>
              ))}
            </div>
            <button
              onClick={handleAddFromTemplates}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('add_from_templates')}
            </button>
          </div>
        )}

        {products.length === 0 && !templateProducts ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Package className="w-7 h-7 text-muted dark:text-stone-400" />
            </div>
            <p className="text-sm text-muted dark:text-stone-400">{t('no_products_settings')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <div key={product.id} className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-sm px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">{product.name}</p>
                  <p className="text-xs text-muted dark:text-stone-400">
                    KES {product.price}{product.unit ? ` / ${product.unit}` : ''}
                    {product.stock !== undefined && (
                      <span className={isLowStock(product) ? ' text-red-500 font-medium' : ''}>
                        {' '}· Stock: {product.stock}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {product.stock !== undefined && (
                    <button
                      onClick={() => { setRestockId(product.id); setRestockQty(''); }}
                      className="w-8 h-8 rounded-lg hover:bg-green-50 flex items-center justify-center"
                      title="Restock"
                    >
                      <RefreshCw className="w-4 h-4 text-muted dark:text-stone-400 hover:text-green-600" />
                    </button>
                  )}
                  {deleteConfirm === product.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted dark:text-stone-400 px-2 py-1">Cancel</button>
                      <button onClick={() => deleteProduct(product.id)} className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded-lg">{t('delete_product')}</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(product.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-muted dark:text-stone-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-sm p-4 mt-4">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('add_product')}
                className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="KES"
                  className="flex-1 rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="pc/kg"
                  className="w-24 rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder={t('initial_stock') || 'Initial stock'}
                  className="flex-1 rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
                <input
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  placeholder={t('low_stock_at') || 'Alert at'}
                  className="w-24 rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setNewName(''); setNewPrice(''); setNewUnit(''); setNewStock(''); setNewThreshold(''); }}
                  className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={async () => {
                    if (!newName.trim() || !newPrice) return;
                    await addProduct(
                      newName.trim(),
                      Number(newPrice),
                      newUnit.trim(),
                      newStock ? Number(newStock) : undefined,
                      newThreshold ? Number(newThreshold) : undefined,
                    );
                    setNewName(''); setNewPrice(''); setNewUnit(''); setNewStock(''); setNewThreshold('');
                    setShowForm(false);
                  }}
                  disabled={!newName.trim() || !newPrice}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:text-green-600 hover:border-green-300 transition-colors mt-4 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('add_product')}
          </button>
        )}

        {restockId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRestockId(null)}>
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-semibold text-ink dark:text-stone-100 mb-3">{t('restock') || 'Restock'}</p>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder={t('quantity') || 'Quantity'}
                className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setRestockId(null)} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">
                  {t('cancel')}
                </button>
                <button
                  onClick={() => handleRestock(restockId, Number(restockQty))}
                  disabled={!restockQty || Number(restockQty) <= 0}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
