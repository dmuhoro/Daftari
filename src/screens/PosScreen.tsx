import { useState, useMemo, useEffect } from 'react';
import { X, Search, ShoppingCart, Plus, Minus, User, Printer, Bluetooth, Camera, Zap } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { db, type Customer } from '../lib/db';
import { scanBarcodeWithFallback } from '../lib/barcode';
import { printBrowserReceipt, printBluetoothReceipt, type ReceiptData } from '../lib/print';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface PosScreenProps {
  onBack: () => void;
}

const POINTS_PER_KES = 100;
const POINTS_REDEEM_RATE = 10; // 10 points = KES 1

export default function PosScreen({ onBack }: PosScreenProps) {
  const { t, language } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const products = business?.products ?? [];
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [printing, setPrinting] = useState(false);
  const [scanning, setScanning] = useState(false);

  const filtered = debouncedSearch
    ? products.filter(p => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || (p.barcode && p.barcode.includes(debouncedSearch)))
    : products;

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const maxRedeem = selectedCustomer ? Math.floor((selectedCustomer.loyalty_points ?? 0) / POINTS_REDEEM_RATE) : 0;
  const discount = redeemPoints ? Math.min(maxRedeem, cartTotal) : 0;
  const finalTotal = Math.max(0, cartTotal - discount);
  const pointsEarned = Math.floor(finalTotal / POINTS_PER_KES);

  function addToCart(product: typeof products[0]) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  }

  async function handleBarcodeScan() {
    setScanning(true);
    const code = await scanBarcodeWithFallback();
    setScanning(false);
    if (code) {
      const found = products.find(p => p.barcode === code);
      if (found) {
        addToCart(found);
      }
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    const receiptId = await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'income',
      category: 'product_sale',
      source: 'pos',
      amount: finalTotal,
      description: cart.map(i => `${i.name} x${i.qty}`).join(', '),
      recorded_at: new Date().toISOString(),
      synced: 0,
    });

    // Update stock
    if (business) {
      const updated = [...(business.products ?? [])];
      for (const item of cart) {
        const idx = updated.findIndex(p => p.id === item.productId);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], stock: Math.max(0, (updated[idx].stock ?? 0) - item.qty) };
        }
      }
      updateBusiness({ products: updated });
      const biz = await db.business.toCollection().first();
      if (biz?.id) {
        await db.business.update(biz.id, { products: JSON.stringify(updated) });
      }
    }

    // Update loyalty
    if (selectedCustomer && selectedCustomer.id) {
      const newPoints = (selectedCustomer.loyalty_points ?? 0) + pointsEarned - (redeemPoints ? discount * POINTS_REDEEM_RATE : 0);
      const newSpent = (selectedCustomer.total_spent ?? 0) + finalTotal;
      const newVisits = (selectedCustomer.total_visits ?? 0) + 1;
      await db.customers.update(selectedCustomer.id, {
        loyalty_points: Math.max(0, newPoints),
        total_spent: newSpent,
        total_visits: newVisits,
        last_visit: new Date().toISOString(),
      });
    }

    setReceiptData({
      businessName: business?.name || 'Daftari',
      receiptId: receiptId || '',
      amount: finalTotal,
      type: 'income',
      description: cart.map(i => `${i.name} x${i.qty}`).join(', '),
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price * i.qty })),
      date: new Date().toISOString(),
      customerName: selectedCustomer?.name,
      loyaltyEarned: pointsEarned,
      loyaltyRedeemed: redeemPoints ? discount * POINTS_REDEEM_RATE : undefined,
      discount: discount > 0 ? discount : undefined,
    });
    setCart([]);
    setSelectedCustomer(null);
    setRedeemPoints(false);
  }

  async function handlePrintBrowser() {
    if (!receiptData) return;
    await printBrowserReceipt(receiptData);
  }

  async function handlePrintBluetooth() {
    if (!receiptData) return;
    setPrinting(true);
    try {
      await printBluetoothReceipt(receiptData);
    } catch (e) { console.warn('Bluetooth print failed:', e); }
    setPrinting(false);
  }

  async function openCustomerPicker() {
    const list = await db.customers.toArray();
    setCustomers(list);
    setShowCustomerPicker(true);
  }

  if (receiptData) {
    return (
      <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-bold text-green-700">{t('sale_recorded')}</p>
          <p className="text-3xl font-bold text-ink dark:text-stone-100">KES {receiptData.amount.toLocaleString('en-KE')}</p>
          {receiptData.receiptId && (
            <p className="text-xs font-mono text-muted dark:text-stone-400">{receiptData.receiptId}</p>
          )}
          <div className="flex gap-3 w-full max-w-xs">
            <button onClick={handlePrintBrowser} className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> {t('print_receipt') || 'Print'}</button>
            <button onClick={handlePrintBluetooth} disabled={printing} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"><Bluetooth className="w-4 h-4" /> {printing ? '...' : (t('print_thermal') || 'Thermal')}</button>
          </div>
          <button onClick={() => setReceiptData(null)} className="py-3 px-6 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('batch_done') || 'Done'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background dark:bg-stone-950">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} aria-label={language === 'sw' ? 'Rudi' : 'Back'} className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1"><X className="w-5 h-5 text-ink dark:text-stone-100" /></button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('pos') || 'POS'}</span>
          </div>
          <button onClick={handleBarcodeScan} disabled={scanning} aria-label={language === 'sw' ? 'Changanua barcode' : 'Scan barcode'} className="ml-auto min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800">
            <Camera className={`w-5 h-5 text-primary-600 ${scanning ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="px-4 py-2 bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted dark:text-stone-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search') || 'Search...'} className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 pl-10 pr-4 py-2.5 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock !== undefined && p.stock <= 0} className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 p-3 flex flex-col items-center gap-1 hover:border-blue-300 active:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[80px]">
                <span className="text-xs font-semibold text-ink dark:text-stone-100 text-center leading-tight line-clamp-2">{p.name}</span>
                <span className="text-xs text-primary-600 font-bold">KES {p.price.toLocaleString('en-KE')}</span>
                {p.stock !== undefined && <span className={`text-[10px] ${p.stock <= 5 ? 'text-red-500' : 'text-muted'}`}>{p.stock}</span>}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted dark:text-stone-400">{t('no_products_settings') || 'No products'}</p>
            </div>
          )}
        </div>

        {/* Cart drawer */}
        {cart.length > 0 && (
          <div className="bg-white dark:bg-stone-900 border-t border-border dark:border-stone-700 px-4 py-3">
            {/* Customer row */}
            <div className="flex items-center gap-2 mb-2">
              <button onClick={openCustomerPicker} className="flex items-center gap-1.5 text-xs text-muted dark:text-stone-400 hover:text-primary-600">
                <User className="w-3.5 h-3.5" />
                {selectedCustomer ? selectedCustomer.name : (t('pos_select_customer') || 'Customer')}
                {selectedCustomer && (selectedCustomer.loyalty_points ?? 0) > 0 && (
                  <span className="text-amber-600 font-medium">({selectedCustomer.loyalty_points}pts)</span>
                )}
              </button>
              {selectedCustomer && (selectedCustomer.loyalty_points ?? 0) >= POINTS_REDEEM_RATE && (
                <button onClick={() => setRedeemPoints(!redeemPoints)} className={`ml-auto text-xs font-medium px-2 py-1 rounded-lg ${redeemPoints ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'}`}>
                  {redeemPoints ? `${language === 'sw' ? 'Tumia' : 'Redeem'} -KES ${discount}` : (language === 'sw' ? 'Tumia alama' : 'Use points')}
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="max-h-32 overflow-y-auto flex flex-col gap-1 mb-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-ink dark:text-stone-100 truncate">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.productId, -1)} aria-label="Decrease quantity" className="min-w-[44px] min-h-[44px] rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center"><Minus className="w-3 h-3 text-muted" /></button>
                    <span className="w-6 text-center text-xs font-semibold text-ink dark:text-stone-100">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} aria-label="Increase quantity" className="min-w-[44px] min-h-[44px] rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center"><Plus className="w-3 h-3 text-muted" /></button>
                  </div>
                  <span className="w-20 text-right text-xs text-primary-600 font-semibold">KES {(item.price * item.qty).toLocaleString('en-KE')}</span>
                </div>
              ))}
            </div>

            {/* Total + Checkout */}
            <div className="flex items-center gap-2 border-t border-border dark:border-stone-700 pt-2">
              <div className="flex-1">
                {discount > 0 && <p className="text-xs text-amber-600">-KES {discount.toLocaleString('en-KE')}</p>}
                <p className="text-sm font-bold text-ink dark:text-stone-100">KES {finalTotal.toLocaleString('en-KE')}</p>
                {selectedCustomer && <p className="text-[10px] text-muted dark:text-stone-400">+{pointsEarned}pts</p>}
              </div>
              <button onClick={handleCheckout} aria-label={t('pos_checkout') || 'Checkout'} className="py-2.5 px-6 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-700"><ShoppingCart className="w-4 h-4" /> {t('pos_checkout') || 'Checkout'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Customer picker modal */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCustomerPicker(false)} autoFocus>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm max-h-96 overflow-y-auto p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-ink dark:text-stone-100 mb-3">{language === 'sw' ? 'Chagua Mteja' : 'Select Customer'}</p>
            {customers.length === 0 ? (
              <p className="text-sm text-muted dark:text-stone-400 text-center py-4">{language === 'sw' ? 'Hakuna wateja' : 'No customers'}</p>
            ) : (
              customers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerPicker(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"><span className="text-xs font-bold text-green-700">{c.name.charAt(0)}</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">{c.name}</p>
                    {(c.loyalty_points ?? 0) > 0 && <p className="text-[10px] text-amber-600">{c.loyalty_points} pts</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
