import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, ShoppingBag, Hammer, Sprout, Scissors, Bike, Briefcase,
  Banknote, Smartphone, Wallet, Store, Building2, Wifi, Landmark,
  Check, ChevronLeft, ArrowRight, Bell, Sparkles, CheckCircle2,
  AlertTriangle, TrendingUp, Notebook, Brain, MessageSquare, ShieldCheck,
  LucideIcon
} from 'lucide-react';
import { useTranslation, type TranslationKey } from '../hooks/useTranslation';
import { requestNotificationPermission, subscribeToPush } from '../lib/pushNotifications';
import { useStore } from '../lib/store';
import { addBusiness } from '../lib/repository';
import { supabase } from '../lib/supabase';
import { BUSINESS_CATEGORIES } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import { track, EVENTS } from '../lib/analytics';
import { captureError } from '../lib/sentry';
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

export type PainPointKey = 'debts' | 'profit' | 'mixed_money' | 'stock';
export type CurrentMethodKey = 'paper' | 'memory' | 'mpesa_sms' | 'none';

interface OptionCard<T extends string> {
  key: T;
  icon: LucideIcon;
  labelKey: TranslationKey;
  descKey?: TranslationKey;
}

const PAIN_POINT_OPTIONS: OptionCard<PainPointKey>[] = [
  { key: 'debts', icon: AlertTriangle, labelKey: 'pain_uncollected_debts' },
  { key: 'profit', icon: TrendingUp, labelKey: 'pain_unknown_profit' },
  { key: 'mixed_money', icon: Wallet, labelKey: 'pain_mixed_money' },
  { key: 'stock', icon: ShoppingBag, labelKey: 'pain_stock_loss' },
];

const CURRENT_METHOD_OPTIONS: OptionCard<CurrentMethodKey>[] = [
  { key: 'paper', icon: Notebook, labelKey: 'method_paper_book' },
  { key: 'memory', icon: Brain, labelKey: 'method_memory' },
  { key: 'mpesa_sms', icon: MessageSquare, labelKey: 'method_mpesa_sms' },
  { key: 'none', icon: ShieldCheck, labelKey: 'method_none' },
];

const YES_SET_QUESTIONS: { id: number; key: TranslationKey }[] = [
  { id: 1, key: 'yes_set_q1' },
  { id: 2, key: 'yes_set_q2' },
  { id: 3, key: 'yes_set_q3' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t, language } = useTranslation();
  const { setBusiness, setLanguage } = useStore();

  const [step, setStep] = useState(0);
  const [selectedPainPoint, setSelectedPainPoint] = useState<PainPointKey>('debts');
  const [selectedCurrentMethod, setSelectedCurrentMethod] = useState<CurrentMethodKey>('paper');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [yesSetStep, setYesSetStep] = useState(0);
  const [selectedPayments, setSelectedPayments] = useState<string[]>(['cash', 'mpesa_send_money']);
  const [businessName, setBusinessName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    track(EVENTS.ONBOARDING_STARTED);
  }, []);

  const totalSteps = 8;
  const progress = Math.min(((step + 1) / totalSteps) * 100, 100);
  const categoryEntries = Object.entries(BUSINESS_CATEGORIES) as [BusinessCategoryKey, typeof BUSINESS_CATEGORIES[BusinessCategoryKey]][];

  function handleStartPlanReveal() {
    setIsAnalyzing(true);
    setStep(5);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1200);
  }

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
      } catch (e) {
        captureError(e, { feature: 'onboarding', action: 'get_user' });
      }

      const localId = crypto.randomUUID();
      await addBusiness({
        local_id: localId,
        name,
        currency: 'KES',
        category: selectedCategory ?? undefined,
        subcategory: selectedSubcategory ?? undefined,
        payment_methods: JSON.stringify(selectedPayments),
        products: '[]',
        user_id: userId,
        created_at: new Date().toISOString(),
        synced: 0,
      });

      setBusiness({
        id: localId,
        local_id: localId,
        name,
        currency: 'KES',
        category: selectedCategory ?? undefined,
        subcategory: selectedSubcategory ?? undefined,
        payment_methods: selectedPayments,
        products: [],
      });
      if (userId) {
        useStore.getState().setActiveBusinessId(localId, userId);
      }

      setStep(7); // Notification prompt step
      track(EVENTS.ONBOARDING_COMPLETED, { category: selectedCategory ?? '' });
    } catch (e) {
      captureError(e, { feature: 'onboarding', action: 'create_business' });
      setSaving(false);
    }
  }

  return (
    <>
      <OnboardingSessionCounter />
      <div className="min-h-dvh bg-background dark:bg-stone-950 flex flex-col font-sans">
        {/* Top Progress bar */}
        <div className="h-1.5 bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-md mx-auto w-full flex flex-col justify-between">
          <div>
            {/* Step 0: Language & Diagnostic Welcome */}
            {step === 0 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-3xl font-black tracking-wider">D</span>
                  </div>
                  <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {t('welcome_daftari')}
                  </h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {t('onboarding_diagnostic_sub')}
                  </p>
                </div>

                {/* Language Toggle */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage('sw')}
                    className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                      language === 'sw'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    Kiswahili
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                      language === 'en'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    English
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium">
                    {language === 'sw'
                      ? 'Programu ya kwanza ya biashara inayofanya kazi 100% bila mtandao (offline-first).'
                      : 'The #1 smart business ledger engineered for offline-first speed and zero data cost.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                >
                  {t('continue')} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 1: Pain Point Quiz Question */}
            {step === 1 && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1 text-sm font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('continue')}
                </button>

                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Step 1 / 6
                  </span>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {t('onboarding_pain_point_q')}
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {PAIN_POINT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedPainPoint === opt.key;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setSelectedPainPoint(opt.key)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 text-emerald-900 dark:text-emerald-200'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold flex-1">
                          {t(opt.labelKey)}
                        </span>
                        {isSelected && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all mt-2"
                >
                  {t('continue')} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 2: Current Tracking Method Quiz */}
            {step === 2 && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm font-semibold text-stone-500 dark:text-stone-400"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('continue')}
                </button>

                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Step 2 / 6
                  </span>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {t('onboarding_current_method_q')}
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {CURRENT_METHOD_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedCurrentMethod === opt.key;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setSelectedCurrentMethod(opt.key)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 text-emerald-900 dark:text-emerald-200'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold flex-1">
                          {t(opt.labelKey)}
                        </span>
                        {isSelected && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all mt-2"
                >
                  {t('continue')} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 3: Business Category & Subcategory */}
            {step === 3 && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-sm font-semibold text-stone-500 dark:text-stone-400"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('continue')}
                </button>

                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Step 3 / 6
                  </span>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {!selectedCategory ? t('what_business') : t('choose_subcategory')}
                  </h2>
                </div>

                {!selectedCategory ? (
                  <div className="grid grid-cols-2 gap-3">
                    {categoryEntries.map(([key, cat]) => {
                      const Icon = CATEGORY_ICONS[cat.icon] || ShoppingBag;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSelectedCategory(key)}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-500 transition-all text-center"
                        >
                          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            {language === 'sw' ? cat.label.sw : cat.label.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs font-bold text-emerald-600 mb-2 self-start hover:underline"
                    >
                      ← {t('what_business')}
                    </button>
                    {Object.entries(BUSINESS_CATEGORIES[selectedCategory].subcategories).map(([key, sub]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setSelectedSubcategory(key)}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                          selectedSubcategory === key
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-medium'
                        }`}
                      >
                        {language === 'sw' ? sub.sw : sub.en}
                      </button>
                    ))}
                    {selectedSubcategory && (
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all mt-4"
                      >
                        {t('continue')} <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: The "Yes Set" Priming (3 Micro-Cards) */}
            {step === 4 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1 text-sm font-semibold text-stone-500 dark:text-stone-400"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('continue')}
                </button>

                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Step 4 / 6 — {t('yes_set_title')}
                  </span>
                  <div className="flex justify-center gap-2 mt-3">
                    {YES_SET_QUESTIONS.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === yesSetStep ? 'w-8 bg-emerald-600' : idx < yesSetStep ? 'w-4 bg-emerald-300' : 'w-4 bg-stone-200 dark:bg-stone-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Yes Set Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border-2 border-emerald-500/30 shadow-xl shadow-emerald-900/5 text-center flex flex-col items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 leading-snug">
                    {t(YES_SET_QUESTIONS[yesSetStep].key)}
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      if (yesSetStep < YES_SET_QUESTIONS.length - 1) {
                        setYesSetStep(yesSetStep + 1);
                      } else {
                        handleStartPlanReveal();
                      }
                    }}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-base font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> {t('yes_answer')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Personalized Plan Reveal */}
            {step === 5 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-bold text-stone-800 dark:text-stone-200">
                      {t('analyzing_business_plan')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/30">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">
                        {t('plan_ready')}
                      </h2>
                    </div>

                    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          {t('plan_benefit_1')}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          {t('plan_benefit_2')}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          {t('plan_benefit_3')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                    >
                      {t('continue')} <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 6: Payment Methods & Business Name */}
            {step === 6 && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex items-center gap-1 text-sm font-semibold text-stone-500 dark:text-stone-400"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('continue')}
                </button>

                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Step 6 / 6
                  </span>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {t('your_business_name')}
                  </h2>
                </div>

                <div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      setNameError('');
                    }}
                    placeholder={t('business_name_placeholder')}
                    className="w-full rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-4 text-base font-medium text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-emerald-600 transition-all"
                    autoFocus
                  />
                  {nameError && <p className="text-red-500 text-xs font-bold mt-1.5">{nameError}</p>}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                    {t('accept_payment')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {PAYMENT_OPTIONS.map((pm) => {
                      const Icon = PAYMENT_ICONS[pm.icon] || Banknote;
                      const isSelected = selectedPayments.includes(pm.key);
                      return (
                        <button
                          type="button"
                          key={pm.key}
                          onClick={() => {
                            setSelectedPayments((prev) =>
                              isSelected ? prev.filter((p) => p !== pm.key) : [...prev, pm.key]
                            );
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-medium text-left truncate flex-1">
                            {language === 'sw' ? pm.sw : pm.en}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !businessName.trim()}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-base font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 mt-2"
                >
                  {saving ? t('saving') : t('start_daftari')}
                </button>
              </div>
            )}

            {/* Step 7: Push Notifications Permission Prompt */}
            {step === 7 && (
              <div className="flex flex-col items-center gap-6 py-6 text-center animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-900/10">
                  <Bell className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                    {language === 'sw' ? 'Pokea ukumbusho wa kufunga siku?' : 'Receive daily close reminders?'}
                  </h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    {language === 'sw'
                      ? 'Tutakukumbusha saa 2 usiku kufunga siku yako ya biashara na kuhesabu faida.'
                      : "We'll remind you at 8:00 PM to close your business day and calculate profit."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <button
                    type="button"
                    onClick={async () => {
                      const granted = await requestNotificationPermission();
                      if (granted) {
                        await subscribeToPush();
                      }
                      onComplete();
                    }}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {language === 'sw' ? 'Ndio, Niarifu' : 'Yes, Notify Me'}
                  </button>
                  <button
                    type="button"
                    onClick={onComplete}
                    className="w-full py-3.5 rounded-2xl border-2 border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-500 dark:text-stone-400"
                  >
                    {language === 'sw' ? 'Achilia' : 'Skip'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
