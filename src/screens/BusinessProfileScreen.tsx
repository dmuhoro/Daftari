import { useState, useEffect } from 'react';
import { ChevronLeft, Building2, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { BUSINESS_CATEGORIES, categoryEmoji } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import { getBusiness, updateBusiness as repoUpdateBusiness } from '../lib/repository';
import { captureError } from '../lib/sentry';

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Pesa Taslimu', en: 'Cash' },
  mpesa_send_money: { sw: 'M-Pesa (Pesa ya Kawaida)', en: 'M-Pesa Send Money' },
  pochi_la_biashara: { sw: 'Pochi La Biashara', en: 'Pochi La Biashara' },
  till_number: { sw: 'Nambari ya Kununulia', en: 'Till Number' },
  paybill: { sw: 'Paybill', en: 'Paybill' },
  airtel_money: { sw: 'Airtel Money', en: 'Airtel Money' },
  bank_transfer: { sw: 'Benki', en: 'Bank Transfer' },
};

interface BusinessProfileScreenProps {
  onBack: () => void;
}

export default function BusinessProfileScreen({ onBack }: BusinessProfileScreenProps) {
  const { t, language } = useTranslation();
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);

  const [name, setName] = useState(business?.name ?? '');
  const [ownerName, setOwnerName] = useState(business?.owner_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const catKey = business?.category as BusinessCategoryKey | undefined;
  const subKey = business?.subcategory;
  const paymentMethods = (business?.payment_methods as string[]) ?? [];

  const catEmoji = catKey ? categoryEmoji[catKey] : null;
  const catLabel = catKey
    ? language === 'sw'
      ? BUSINESS_CATEGORIES[catKey]?.label.sw
      : BUSINESS_CATEGORIES[catKey]?.label.en
    : null;

  const subLabel = catKey && subKey
    ? language === 'sw'
      ? (BUSINESS_CATEGORIES[catKey]?.subcategories as Record<string, { sw: string; en: string }>)[subKey]?.sw
      : (BUSINESS_CATEGORIES[catKey]?.subcategories as Record<string, { sw: string; en: string }>)[subKey]?.en
    : null;

  useEffect(() => {
    if (business?.name) setName(business.name);
    if (business?.owner_name) setOwnerName(business.owner_name);
  }, [business?.name, business?.owner_name]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    updateBusiness({ name: name.trim(), owner_name: ownerName.trim() || undefined });
    try {
      const bizResult = await getBusiness();
      if (bizResult.ok && bizResult.value?.id) {
        await repoUpdateBusiness(bizResult.value.id, { name: name.trim(), owner_name: ownerName.trim() || undefined });
      }
    } catch (e) { captureError(e, { feature: 'business_profile', action: 'save' }) }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('business_profile')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        {/* Category display */}
        {catKey && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 p-4 flex items-center gap-3">
            {catEmoji && <span className="text-2xl">{catEmoji}</span>}
            <div>
              <p className="text-sm font-medium text-ink dark:text-stone-100">{catLabel}</p>
              {subLabel && <p className="text-xs text-muted dark:text-stone-400">{subLabel}</p>}
            </div>
          </div>
        )}

        {/* Business Name */}
        <div>
          <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('business_name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-base text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('owner_name')}</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder={t('owner_name_placeholder')}
            className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-base text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
          />
        </div>

        {/* Payment Methods */}
        {paymentMethods.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted dark:text-stone-400 mb-2">{t('payment_methods')}</p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((pm) => (
                <span
                  key={pm}
                  className="text-xs bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full px-3 py-1.5 border border-green-200 dark:border-green-700"
                >
                  {language === 'sw' ? PAYMENT_LABELS[pm]?.sw : PAYMENT_LABELS[pm]?.en ?? pm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-base font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-auto"
        >
          {saved ? (
            <><Check className="w-5 h-5" /> {t('saved')}</>
          ) : saving ? (
            t('saving')
          ) : (
            t('save')
          )}
        </button>
      </div>
    </div>
  );
}
