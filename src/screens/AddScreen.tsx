import { TrendingUp, TrendingDown, ArrowDownCircle, MessageSquare, AlertTriangle, CreditCard, Package } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';

import { CATEGORY_DASHBOARD_LABELS } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';

type SubView =
  | 'add/sale'
  | 'add/expense'
  | 'add/withdrawal'
  | 'add/sms'
  | 'add/fuliza-debt'
  | 'add/fuliza-repaid';

interface AddScreenProps {
  onNavigate: (view: SubView | 'catalog') => void;
}

export default function AddScreen({ onNavigate }: AddScreenProps) {
  const { t, language } = useTranslation();
  const business = useStore((s) => s.business);
  const products = business?.products ?? [];

  const catKey = business?.category as BusinessCategoryKey | undefined;
  const paymentMethods = (business?.payment_methods as string[]) ?? [];

  const isCashOnly = paymentMethods.length === 0 || (paymentMethods.length === 1 && paymentMethods[0] === 'cash');

  const dashboardLabels = catKey ? CATEGORY_DASHBOARD_LABELS[catKey] : null;
  const incomeLabel = dashboardLabels
    ? language === 'sw' ? dashboardLabels.incomeLabel.sw : dashboardLabels.incomeLabel.en
    : t('income');

  const cards = [
    {
      view: 'add/sale' as SubView,
      label: t('add_sale'),
      sublabel: incomeLabel,
      icon: TrendingUp,
      bg: 'bg-primary-600',
      iconBg: 'bg-primary-700',
      textColor: 'text-white',
      subColor: 'text-primary-200',
      chip: products.length > 0 ? `${products.length} ${t('my_products').toLowerCase()}` : undefined,
    },
    {
      view: 'add/sms' as SubView,
      label: t('bandika_sms'),
      sublabel: 'M-Pesa',
      icon: MessageSquare,
      bg: 'bg-white dark:bg-stone-900',
      iconBg: 'bg-purple-50',
      textColor: 'text-ink dark:text-stone-100',
      subColor: 'text-muted dark:text-stone-400',
      iconColor: 'text-purple-600',
      border: 'border border-border dark:border-stone-700',
    },
    {
      view: 'add/expense' as SubView,
      label: t('add_expense'),
      sublabel: t('expenses'),
      icon: TrendingDown,
      bg: 'bg-white dark:bg-stone-900',
      iconBg: 'bg-red-50',
      textColor: 'text-ink dark:text-stone-100',
      subColor: 'text-muted dark:text-stone-400',
      iconColor: 'text-danger',
      border: 'border border-border dark:border-stone-700',
    },
    {
      view: 'add/withdrawal' as SubView,
      label: t('add_withdrawal'),
      sublabel: t('withdrawal'),
      icon: ArrowDownCircle,
      bg: 'bg-white dark:bg-stone-900',
      iconBg: 'bg-amber-50',
      textColor: 'text-ink dark:text-stone-100',
      subColor: 'text-muted dark:text-stone-400',
      iconColor: 'text-amber-500',
      border: 'border border-border dark:border-stone-700',
    },
  ];

  const visibleCards = isCashOnly
    ? cards.filter((c) => c.view !== 'add/sms')
    : cards;

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
      <p className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-widest mb-1">
        {t('quick_add')}
      </p>

      {visibleCards.map(({ view, label, sublabel, icon: Icon, bg, iconBg, textColor, subColor, iconColor, border, chip }) => (
        <button
          key={view}
          onClick={() => onNavigate(view)}
          className={`${bg} ${border ?? ''} rounded-2xl p-5 flex items-center gap-4 shadow-card active:scale-[0.98] transition-transform`}
        >
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor ?? 'text-white'}`} strokeWidth={2} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className={`text-base font-semibold ${textColor}`}>{label}</span>
              {chip && (
                <span className="text-[10px] font-medium bg-white/20 text-white rounded-full px-2 py-0.5">
                  {chip}
                </span>
              )}
            </div>
            <span className={`text-xs ${subColor}`}>{sublabel}</span>
          </div>
          <div className="ml-auto">
            <svg className={`w-4 h-4 ${subColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}

      {/* Fuliza Section (hidden for cash-only) */}
      {!isCashOnly && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-widest mb-2">
            {t('fuliza')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('add/fuliza-debt')}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center gap-2 shadow-card active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-amber-800 text-center">{t('chukua_fuliza')}</span>
            </button>
            <button
              onClick={() => onNavigate('add/fuliza-repaid')}
              className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center gap-2 shadow-card active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-green-800 text-center">{t('lipa_fuliza')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Products link */}
      <button
        onClick={() => onNavigate('catalog')}
        className="w-full flex items-center justify-between bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 p-4 shadow-card mt-2 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-ink dark:text-stone-100">{t('my_products')}</span>
            <p className="text-xs text-muted dark:text-stone-400">{products.length > 0 ? `${products.length} items` : t('no_products_settings')}</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-muted dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
