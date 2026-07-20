import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, ShoppingBag, Hammer, Sprout, Scissors, Bike, Briefcase,
  Banknote, Smartphone, Wallet, Store, Building2, Wifi, Landmark,
  Check, ChevronLeft, ArrowRight, Bell,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { requestNotificationPermission, subscribeToPush } from '../lib/pushNotifications';
import { useStore } from '../lib/store';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { BUSINESS_CATEGORIES } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import { track, EVENTS } from '../lib/analytics';
import OnboardingSessionCounter from '../components/OnboardingSessionCounter';

const CATEGORY_ICONS: Record<string, typeof UtensilsCrossed> = {
  UtensilsCrossed, ShoppingBag, Hammer, Sprout, Scissors, Bike, Briefcase,
};

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  Banknote, Smartphone, Wallet, Store, Building2, Wifi, Landmark,
};

const PAYMENT_OPTIONS = [
  { key: 'cash', icon: 'Banknote', sw: 'Pesa Taslimu', en: 'Cash' },
  { key: 'mpesa_send_money', icon: 'Smartphone', sw: 'M-Pesa (Pesa ya Kawaida)', en: 'M-Pesa Send Money' },
  { key: 'pochi_la_biashara', icon: 'Wallet', sw: 'Pochi La Biashara', en: 'Pochi La Biashara' },
  { key: 'till_number', icon: 'Store', sw: 'Nambari ya Kununulia', en: 'Till Number' },
  { key: 'paybill', icon: 'Building2', sw: 'Paybill', en: 'Paybill' },
  { key: 'airtel_money', icon: 'Wifi', sw: 'Airtel Money', en: 'Airtel Money' },
  { key: 'bank_transfer', icon: 'Landmark', sw: 'Benki', en: 'Bank Transfer' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t, language } = useTranslation();
  const { setBusiness, setLanguage } = useStore();

  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => { track(EVENTS.ONBOARDING_STARTED) }, [])

  const progress = ((step + 1) / 5) * 100;
  const categoryEntries = Object.entries(BUSINESS_CATEGORIES) as [BusinessCategoryKey, typeof BUSINESS_CATEGORIES[BusinessCategoryKey]][];

  async function handleSubmit() {
    if (!businessName.trim() || businessName.trim().length < 2) {
      setNameError(t('please_enter_valid_amount'));
      return;
    }
    setSaving(true);
    const name = businessName.trim();

    try {
      let userId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (e) { console.warn('Failed to get user for onboarding', e); }

      await db.business.add({
        name,
        currency: 'KES',
        category: selectedCategory ?? undefined,
        subcategory: selectedSubcategory ?? undefined,
        payment_methods: JSON.stringify(selectedPayments),
        products: '[]',
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      setBusiness({
        id: userId ?? '',
        name,
        currency: 'KES',
        category: selectedCategory ?? undefined,
        subcategory: selectedSubcategory ?? undefined,
        payment_methods: selectedPayments,
        products: [],
      });

      onComplete();
      track(EVENTS.ONBOARDING_COMPLETED, { category: selectedCategory ?? '' })

      supabase.from('daftari_businesses').upsert({
        name,
        currency: 'KES',
        category: selectedCategory,
        subcategory: selectedSubcategory,
        payment_methods: selectedPayments,
        products: [],
        owner_id: userId,
      }, { onConflict: 'owner_id' }).then(({ error }) => {
        if (error) console.warn('Background sync failed:', error);
      });
    } catch (e) { console.warn('Failed to create business in Supabase:', e); setSaving(false); }
  }

  return (
    <>
      <OnboardingSessionCounter />
      <div className="min-h-dvh bg-background dark:bg-stone-950 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-green-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Step 0: Language + Category */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl font-black">D</span>
              </div>
              <h1 className="text-2xl font-bold text-ink dark:text-stone-100">{t('welcome_daftari')}</h1>
            </div>

            {/* Language toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage('sw')}
                className={`flex-1 py-4 rounded-2xl text-base font-semibold border-2 transition-colors ${
                  language === 'sw' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-stone-900 text-ink dark:text-stone-100 border-border dark:border-stone-700'
                }`}
              >
                Kiswahili
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-4 rounded-2xl text-base font-semibold border-2 transition-colors ${
                  language === 'en' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-stone-900 text-ink dark:text-stone-100 border-border dark:border-stone-700'
                }`}
              >
                English
              </button>
            </div>

            <p className="text-sm text-muted dark:text-stone-400 text-center">{t('what_business')}</p>

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-3">
              {categoryEntries.map(([key, cat]) => {
                const Icon = CATEGORY_ICONS[cat.icon] || ShoppingBag;
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedCategory(key); setStep(1); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      isSelected ? 'bg-green-50 border-green-600' : 'bg-white dark:bg-stone-900 border-border dark:border-stone-700 hover:border-green-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-green-600' : 'bg-stone-100 dark:bg-stone-800'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-muted dark:text-stone-400'}`} />
                    </div>
                    <span className={`text-xs font-medium text-center ${isSelected ? 'text-green-700' : 'text-ink dark:text-stone-100'}`}>
                      {language === 'sw' ? cat.label.sw : cat.label.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Subcategory */}
        {step === 1 && selectedCategory && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-muted dark:text-stone-400 mb-1">
              <ChevronLeft className="w-4 h-4" /> {t('continue')}
            </button>
            <h2 className="text-lg font-bold text-ink dark:text-stone-100">{t('choose_subcategory')}</h2>
            <div className="flex flex-col gap-2">
              {Object.entries(BUSINESS_CATEGORIES[selectedCategory].subcategories).map(([key, sub]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSubcategory(key)}
                  className={`w-full text-left px-4 py-4 rounded-2xl border-2 transition-colors ${
                    selectedSubcategory === key ? 'bg-green-50 border-green-600' : 'bg-white dark:bg-stone-900 border-border dark:border-stone-700'
                  }`}
                >
                  <span className={`text-sm font-medium ${selectedSubcategory === key ? 'text-green-700' : 'text-ink dark:text-stone-100'}`}>
                    {language === 'sw' ? sub.sw : sub.en}
                  </span>
                </button>
              ))}
            </div>
            {selectedSubcategory && (
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-green-600 text-white text-base font-semibold flex items-center justify-center gap-2"
              >
                {t('continue')} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Payment Methods */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted dark:text-stone-400 mb-1">
              <ChevronLeft className="w-4 h-4" /> {t('continue')}
            </button>
            <h2 className="text-lg font-bold text-ink dark:text-stone-100">{t('accept_payment')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map((pm) => {
                const Icon = PAYMENT_ICONS[pm.icon] || Banknote;
                const isSelected = selectedPayments.includes(pm.key);
                return (
                  <button
                    key={pm.key}
                    onClick={() => {
                      setSelectedPayments((prev) =>
                        isSelected ? prev.filter((p) => p !== pm.key) : [...prev, pm.key]
                      );
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      isSelected ? 'bg-green-50 border-green-600' : 'bg-white dark:bg-stone-900 border-border dark:border-stone-700 hover:border-green-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-green-600' : 'bg-stone-100 dark:bg-stone-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-muted dark:text-stone-400'}`} />
                    </div>
                    <span className={`text-xs font-medium text-center ${isSelected ? 'text-green-700' : 'text-ink dark:text-stone-100'}`}>
                      {language === 'sw' ? pm.sw : pm.en}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-green-600" />}
                  </button>
                );
              })}
            </div>
            {selectedPayments.length > 0 && (
              <button
                onClick={() => setStep(3)}
                className="w-full py-4 rounded-2xl bg-green-600 text-white text-base font-semibold flex items-center justify-center gap-2"
              >
                {t('continue')} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Step 4: Notification Permission */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Bell className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-ink dark:text-stone-100 mb-2">
                {language === 'sw' ? 'Pokea ukumbusho wa kufunga siku?' : 'Receive daily close reminders?'}
              </h2>
              <p className="text-sm text-muted dark:text-stone-400">
                {language === 'sw'
                  ? 'Tutakukumbusha saa 2 usiku kufunga siku yako ya biashara.'
                  : "We'll remind you at 8pm to close your business day."}
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    await subscribeToPush();
                  }
                  onComplete();
                }}
                className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-base font-semibold transition-colors"
              >
                {language === 'sw' ? 'Ndio, Niarifu' : 'Yes, Notify Me'}
              </button>
              <button
                onClick={onComplete}
                className="w-full py-4 rounded-2xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 transition-colors"
              >
                {language === 'sw' ? 'Achilia' : 'Skip'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Business Name */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted dark:text-stone-400 mb-1">
              <ChevronLeft className="w-4 h-4" /> {t('continue')}
            </button>
            <h2 className="text-lg font-bold text-ink dark:text-stone-100">{t('your_business_name')}</h2>
            <div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => { setBusinessName(e.target.value); setNameError(''); }}
                placeholder={t('business_name_placeholder')}
                className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-4 text-base text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                autoFocus
              />
              {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || !businessName.trim()}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-base font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? t('saving') : t('start_daftari')}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
