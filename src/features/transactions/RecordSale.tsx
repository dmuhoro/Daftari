import { useState } from 'react';
import { Zap, Smartphone, Banknote, Wallet, Store, Building2, Wifi, Landmark } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { getBusiness, updateBusiness as repoUpdateBusiness } from '../../lib/repository';
import { BUSINESS_CATEGORIES, getTemplateProducts } from '../../lib/businessCategories';
import type { BusinessCategoryKey } from '../../lib/businessCategories';
import SuccessFlash from '../../components/SuccessFlash';
import { shareViaWhatsApp, formatReceiptText } from '../../lib/whatsapp';
import { track, EVENTS } from '../../lib/analytics';
import { captureError } from '../../lib/sentry';

interface RecordSaleProps {
  onSave: () => void;
  onCancel: () => void;
}

const PAYMENT_ICONS: Record<string, typeof Smartphone> = {
  cash: Banknote,
  mpesa_send_money: Smartphone,
  pochi_la_biashara: Wallet,
  till_number: Store,
  paybill: Building2,
  airtel_money: Wifi,
  bank_transfer: Landmark,
};

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Taslimu', en: 'Cash' },
  mpesa_send_money: { sw: 'M-Pesa', en: 'M-Pesa' },
  pochi_la_biashara: { sw: 'Pochi', en: 'Pochi' },
  till_number: { sw: 'Till', en: 'Till' },
  paybill: { sw: 'Paybill', en: 'Paybill' },
  airtel_money: { sw: 'Airtel', en: 'Airtel' },
  bank_transfer: { sw: 'Benki', en: 'Bank' },
};

const DEFAULT_INCOME_CATEGORIES = [
  { key: 'product_sale', sw: 'Bidhaa', en: 'Product' },
  { key: 'service', sw: 'Huduma', en: 'Service' },
  { key: 'other_income', sw: 'Nyingine', en: 'Other' },
];

export default function RecordSale({ onSave, onCancel }: RecordSaleProps) {
  const { t, language } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('product_sale');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [flashAmount, setFlashAmount] = useState<number | null>(null);
  const [flashReceiptId, setFlashReceiptId] = useState<string | undefined>();
  const [flashDescription, setFlashDescription] = useState<string | undefined>();
  const [amountError, setAmountError] = useState('');
  const [addedTemplates, setAddedTemplates] = useState(false);

  const products = business?.products ?? [];
  const userPaymentMethods = (business?.payment_methods as string[]) ?? [];

  const catKey = business?.category as BusinessCategoryKey | undefined;
  const subKey = business?.subcategory;

  const incomeCategories = catKey && BUSINESS_CATEGORIES[catKey]
    ? ('incomeCategories' in BUSINESS_CATEGORIES[catKey]
        ? (BUSINESS_CATEGORIES[catKey] as unknown as {
            incomeCategories: Array<{ key: string; sw: string; en: string }>;
          }).incomeCategories
        : DEFAULT_INCOME_CATEGORIES)
    : DEFAULT_INCOME_CATEGORIES;

  const templateProducts = catKey && subKey ? getTemplateProducts(catKey, subKey) : undefined;

  if (!paymentMethod && userPaymentMethods.length === 1) {
    setPaymentMethod(userPaymentMethods[0]);
  }

  async function handleQuickSale(product: { name: string; price: number; unit?: string; id: string; stock?: number; low_stock_threshold?: number }) {
    setSaving(true);
    const receiptId = await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'income',
      category: category,
      source: 'manual',
      amount: product.price,
      description: product.name,
      recorded_at: new Date().toISOString(),
      synced: 0,
      payment_method: paymentMethod || undefined,
    });
    setSaving(false);
    setFlashAmount(product.price);
    setFlashReceiptId(receiptId);
    setFlashDescription(product.name);
    track(EVENTS.TRANSACTION_RECORDED, { type: 'income', method: 'quick_sale' })

    if (product.stock !== undefined && business) {
      const updatedProducts = products.map((p) =>
        p.id === product.id
          ? { ...p, stock: Math.max(0, (p.stock ?? 0) - 1) }
          : p
      );
      updateBusiness({ products: updatedProducts });
      try {
        const bizResult = await getBusiness();
        if (bizResult.ok && bizResult.value?.id) {
          await repoUpdateBusiness(bizResult.value.id, { products: JSON.stringify(updatedProducts) });
        }
      } catch (e) { captureError(e, { feature: 'record_sale', action: 'sync_stock' }) }
    }
  }

  async function handleAddAllTemplates() {
    if (!templateProducts) return;
    setAddedTemplates(true);
    for (const tp of templateProducts) {
      await addTransaction({
        local_id: crypto.randomUUID(),
        type: 'income',
        category: category,
        source: 'manual',
        amount: tp.price,
        description: tp.name,
        recorded_at: new Date().toISOString(),
        synced: 0,
        payment_method: paymentMethod || undefined,
      });
    }
    track(EVENTS.TRANSACTION_RECORDED, { type: 'income', method: 'template_bulk' })
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
    const receiptId = await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'income',
      category,
      source: 'manual',
      amount: Number(amount),
      description: description || undefined,
      recorded_at: new Date().toISOString(),
      synced: 0,
      payment_method: paymentMethod || undefined,
    });
    setSaving(false);
    setFlashAmount(Number(amount));
    setFlashReceiptId(receiptId);
    setFlashDescription(description || undefined);
    track(EVENTS.TRANSACTION_RECORDED, { type: 'income', method: 'manual' })
  }

  if (flashAmount !== null) {
    return (
      <SuccessFlash
        amount={flashAmount}
        type="income"
        onDismiss={onSave}
        receiptId={flashReceiptId}
        description={flashDescription}
        onShare={flashReceiptId ? () => {
          shareViaWhatsApp(formatReceiptText(
            business?.name || 'Daftari',
            flashReceiptId!,
            flashAmount,
            'income',
            flashDescription,
          ));
        } : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-6">
      {/* Quick-add: user's saved products */}
      {products.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => handleQuickSale(product)}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl px-4 py-3 shadow-md transition-colors disabled:opacity-60 flex-shrink-0"
            >
              <Zap className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-sm font-semibold whitespace-nowrap">
                {product.name} — KES {product.price}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Quick-add: template products (for new users with no saved products) */}
      {products.length === 0 && templateProducts && !addedTemplates && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">{t('add_from_templates')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {templateProducts.map((tp, i) => (
              <span key={i} className="text-xs bg-white dark:bg-stone-900 rounded-full px-3 py-1 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                {tp.name} — KES {tp.price}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddAllTemplates}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {t('add_from_templates')}
            </button>
          </div>
        </div>
      )}

      {products.length === 0 && !templateProducts && (
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onCancel(); }}
          className="block text-center text-sm text-muted dark:text-stone-400 bg-gray-50 dark:bg-stone-900 rounded-2xl py-4 border border-dashed border-border dark:border-stone-700"
        >
          {t('no_products_settings')}
        </a>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted dark:text-stone-400">au / or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
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

        {userPaymentMethods.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('payment_method_label')}</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {userPaymentMethods.map((pm) => {
                const Icon = PAYMENT_ICONS[pm] || Banknote;
                const isSelected = paymentMethod === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-stone-900 text-muted dark:text-stone-400 border-border dark:border-stone-700 hover:border-green-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {language === 'sw' ? PAYMENT_LABELS[pm]?.sw : PAYMENT_LABELS[pm]?.en ?? pm}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('category')}</label>
          <div className="grid grid-cols-3 gap-2">
            {incomeCategories.map((ic) => (
              <button
                key={ic.key}
                type="button"
                onClick={() => setCategory(ic.key)}
                className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  category === ic.key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-stone-900 text-muted dark:text-stone-400 border-border dark:border-stone-700 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                {language === 'sw' ? ic.sw : ic.en}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">
            {t('description')} <span className="text-muted dark:text-stone-400 font-normal">({t('optional')})</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('description')}
            maxLength={200}
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
            className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
