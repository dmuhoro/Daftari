import { ChevronDown, Check, Flame, Zap } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { categoryEmoji, BUSINESS_CATEGORIES } from '../../lib/businessCategories';
import type { BusinessCategoryKey } from '../../lib/businessCategories';
import SyncDot from '../SyncDot';

function formatDateSw(date: Date): string {
  const SW_DAYS = ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'];
  const SW_MONTHS = ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'];
  const day = SW_DAYS[date.getDay()];
  const d = date.getDate();
  const month = SW_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}, ${d} ${month} ${year}`;
}

function formatDateEn(date: Date): string {
  return date.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface DashboardHeaderProps {
  streak: number;
  showBizSwitcher: boolean;
  onToggleBizSwitcher: () => void;
  onSwitchBusiness: (biz: { id: string; name: string }) => void;
  onNavigate?: (view: string) => void;
}

function StreakChip({ streak }: { streak: number }) {
  const { t } = useTranslation();
  if (streak >= 2 && streak < 30) {
    return (
      <div className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-full px-3 py-1 text-sm mt-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-medium">{t('streak_days_label', { count: streak })}</span>
      </div>
    );
  }
  if (streak >= 30) {
    return (
      <div className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 rounded-full px-3 py-1 text-sm mt-2">
        <span className="text-xs font-medium">{t('streak_milestone', { count: streak })}</span>
      </div>
    );
  }
  return null;
}

export default function DashboardHeader({ streak, showBizSwitcher, onToggleBizSwitcher, onSwitchBusiness, onNavigate }: DashboardHeaderProps) {
  const { language } = useTranslation();
  const business = useStore((s) => s.business);
  const businesses = useStore((s) => s.businesses);
  const setLanguage = useStore((s) => s.setLanguage);
  const setBusiness = useStore((s) => s.setBusiness);
  const setActiveBusinessId = useStore((s) => s.setActiveBusinessId);
  const todayDate = new Date();

  const catKey = business?.category as BusinessCategoryKey | undefined;
  const catEmoji = catKey ? categoryEmoji[catKey] : null;
  const catLabel = catKey
    ? language === 'sw'
      ? BUSINESS_CATEGORIES[catKey]?.label.sw
      : BUSINESS_CATEGORIES[catKey]?.label.en
    : null;

  const formattedDate = language === 'sw' ? formatDateSw(todayDate) : formatDateEn(todayDate);
  const businessName = business?.name ?? 'Daftari';

  return (
    <div className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4 py-4">
      <div className="flex items-start justify-between">
        <div className="relative">
          <div className="flex items-center gap-2">
            {catEmoji && <span className="text-xl">{catEmoji}</span>}
            <button
              onClick={onToggleBizSwitcher}
              aria-label={language === 'sw' ? 'Badilisha biashara' : 'Switch business'}
              className="flex items-center gap-1 max-w-[200px]"
            >
              <h1 className="text-lg font-bold text-ink dark:text-stone-100 truncate">{businessName}</h1>
              {businesses.length > 1 && <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" />}
            </button>
            <SyncDot />
          </div>
          {catLabel && (
            <p className="text-xs text-muted dark:text-stone-400 mt-0.5">{catLabel}</p>
          )}
          <p className="text-sm text-muted dark:text-stone-400 mt-0.5">{formattedDate}</p>

          {showBizSwitcher && businesses.length > 1 && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-xl p-2 min-w-[200px]">
              <p className="text-xs font-medium text-muted dark:text-stone-400 px-3 py-1.5 uppercase tracking-wider">
                {language === 'sw' ? 'Badilisha Biashara' : 'Switch Business'}
              </p>
              {businesses.map((biz) => {
                const isActive = biz.id === business?.id;
                return (
                  <button
                    key={biz.id}
                    onClick={() => {
                      setBusiness(biz);
                      setActiveBusinessId(biz.id);
                      onSwitchBusiness(biz);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-ink dark:text-stone-100'
                    }`}
                  >
                    <span className="text-lg">{catEmoji}</span>
                    <span className="truncate">{biz.name}</span>
                    {isActive && <Check className="w-4 h-4 ml-auto text-green-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button onClick={() => onNavigate('pos')} aria-label={language === 'sw' ? 'Fungua POS' : 'Open POS'} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600">{language === 'sw' ? 'POS' : 'POS'}</span>
            </button>
          )}
          <button
            onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
            aria-label={language === 'sw' ? 'Badilisha lugha' : 'Switch language'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors"
          >
            <span className={`text-xs font-semibold ${language === 'sw' ? 'text-primary-600' : 'text-muted dark:text-stone-400'}`}>SW</span>
            <span className="text-xs text-muted dark:text-stone-400">/</span>
            <span className={`text-xs font-semibold ${language === 'en' ? 'text-primary-600' : 'text-muted dark:text-stone-400'}`}>EN</span>
          </button>
        </div>
      </div>
      <StreakChip streak={streak} />
    </div>
  );
}
