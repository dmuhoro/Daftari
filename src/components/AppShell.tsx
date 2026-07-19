import { useState, useEffect } from 'react';
import { Home, PlusCircle, ClipboardList, Settings, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import type { TranslationKey } from '../hooks/useTranslation';
import { useSync } from '../hooks/useSync';
import { useStore } from '../lib/store';
import DashboardScreen from '../screens/DashboardScreen';
import AddScreen from '../screens/AddScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductCatalogScreen from '../screens/ProductCatalogScreen';
import BusinessProfileScreen from '../screens/BusinessProfileScreen';

import RecordSale from '../features/transactions/RecordSale';
import RecordExpense from '../features/transactions/RecordExpense';
import RecordWithdrawal from '../features/transactions/RecordWithdrawal';
import RecordFulizaDebt from '../features/transactions/RecordFulizaDebt';
import RecordFulizaRepaid from '../features/transactions/RecordFulizaRepaid';
import SMSParser from '../features/sms/SMSParser';
import DailyClose from '../features/close/DailyClose';
import OfflineBanner from './OfflineBanner';

type View =
  | 'dashboard'
  | 'add'
  | 'add/sale'
  | 'add/expense'
  | 'add/withdrawal'
  | 'add/sms'
  | 'add/fuliza-debt'
  | 'add/fuliza-repaid'
  | 'history'
  | 'settings'
  | 'catalog'
  | 'profile';

type BottomTab = 'dashboard' | 'add' | 'history' | 'settings';

interface AppShellProps {
  onSignOut: () => void;
}

function activeTab(view: View): BottomTab {
  if (view.startsWith('add')) return 'add';
  if (view === 'catalog') return 'settings';
  if (view === 'profile') return 'settings';
  return view as BottomTab;
}

function viewTitle(view: View, t: (k: TranslationKey) => string): string {
  switch (view) {
    case 'dashboard': return t('dashboard');
    case 'add': return t('add');
    case 'add/sale': return t('add_sale');
    case 'add/expense': return t('add_expense');
    case 'add/withdrawal': return t('add_withdrawal');
    case 'add/sms': return t('mpesa_income');
    case 'add/fuliza-debt': return t('chukua_fuliza');
    case 'add/fuliza-repaid': return t('lipa_fuliza');
    case 'history': return t('history');
    case 'settings': return t('settings');
    case 'catalog': return t('my_products');
    case 'profile': return t('business_profile');
  }
}

export default function AppShell({ onSignOut }: AppShellProps) {
  const { t } = useTranslation();
  const { isOnline } = useSync();
  const transactions = useStore((s) => s.transactions);
  const lastCloseDate = useStore((s) => s.lastCloseDate);
  const closePromptDismissedAt = useStore((s) => s.closePromptDismissedAt);
  const dismissClosePrompt = useStore((s) => s.dismissClosePrompt);
  const [view, setView] = useState<View>('dashboard');
  const [showDailyClose, setShowDailyClose] = useState(false);

  const tab = activeTab(view);
  const isSubView = view.includes('/');
  const hideNav = view === 'catalog' || view === 'profile';

  const tabs: { key: BottomTab; icon: typeof Home; labelKey: TranslationKey }[] = [
    { key: 'dashboard', icon: Home, labelKey: 'dashboard' },
    { key: 'add', icon: PlusCircle, labelKey: 'add' },
    { key: 'history', icon: ClipboardList, labelKey: 'history' },
    { key: 'settings', icon: Settings, labelKey: 'settings' },
  ];

  function handleTabPress(key: BottomTab) {
    if (key === 'add') setView('add');
    else setView(key as View);
  }

  useEffect(() => {
    function checkDailyClose() {
      const now = new Date();
      const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
      const todayStr = nairobi.toISOString().slice(0, 10);
      const hours = nairobi.getHours();

      if (hours < 20) return;
      if (lastCloseDate === todayStr) return;
      if (closePromptDismissedAt && Date.now() - closePromptDismissedAt < 2 * 60 * 60 * 1000) return;

      const todayTxs = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === todayStr);
      if (todayTxs.length === 0) return;

      setShowDailyClose(true);
    }

    checkDailyClose();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDailyClose();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [transactions, lastCloseDate, closePromptDismissedAt]);

  return (
    <div className="min-h-dvh flex flex-col bg-background dark:bg-stone-950">
      {!isOnline && <OfflineBanner />}

      {/* Header */}
      {view !== 'dashboard' && view !== 'catalog' && view !== 'profile' && (
        <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4 pt-safe-top">
          <div className="flex items-center h-14 gap-2">
            {isSubView ? (
              <button
                onClick={() => setView('add')}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors -ml-1"
              >
                <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <span className="font-bold text-ink dark:text-stone-100 text-base tracking-tight">{t('app_name')}</span>
              </div>
            )}
            <span className={`text-sm font-semibold text-muted dark:text-stone-400 ${isSubView ? '' : 'ml-auto'}`}>
              {viewTitle(view, t)}
            </span>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {view === 'dashboard' && <DashboardScreen />}
        {view === 'add' && (
          <AddScreen onNavigate={(v) => setView(v)} />
        )}
        {view === 'add/sale' && (
          <RecordSale onSave={() => setView('dashboard')} onCancel={() => setView('add')} />
        )}
        {view === 'add/expense' && (
          <RecordExpense onSave={() => setView('dashboard')} onCancel={() => setView('add')} />
        )}
        {view === 'add/withdrawal' && (
          <RecordWithdrawal onSave={() => setView('dashboard')} onCancel={() => setView('add')} />
        )}
        {view === 'add/sms' && (
          <SMSParser
            onSave={() => setView('dashboard')}
            onCancel={() => setView('add')}
            onManualEntry={() => setView('add/sale')}
          />
        )}
        {view === 'add/fuliza-debt' && (
          <RecordFulizaDebt onSave={() => setView('dashboard')} onCancel={() => setView('add')} />
        )}
        {view === 'add/fuliza-repaid' && (
          <RecordFulizaRepaid onSave={() => setView('dashboard')} onCancel={() => setView('add')} />
        )}
        {view === 'history' && <HistoryScreen />}
        {view === 'settings' && <SettingsScreen onSignOut={onSignOut} onNavigate={(v) => setView(v as View)} />}
        {view === 'catalog' && <ProductCatalogScreen onBack={() => setView('settings')} />}
        {view === 'profile' && <BusinessProfileScreen onBack={() => setView('settings')} />}
      </main>

      {/* Fixed Bottom nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 safe-area-inset-bottom">
          <div className="flex items-stretch">
            {tabs.map(({ key, icon: Icon, labelKey }) => {
              const isActive = tab === key;
              const isAdd = key === 'add';
              return (
                <button
                  key={key}
                  aria-label={t(labelKey)}
                  onClick={() => handleTabPress(key)}
                  className="flex-1 flex flex-col items-center justify-center pt-2 pb-3 min-h-[64px] relative"
                >
                  {isAdd ? (
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? 'bg-primary-600' : 'bg-primary-100 dark:bg-primary-900'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isActive ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`}
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : (
                    <>
                      <Icon
                        className={`w-6 h-6 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'}`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className={`text-xs mt-1 font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'}`}>
                        {t(labelKey)}
                      </span>
                      {isActive && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-green-600 dark:bg-green-400" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Daily Close Prompt */}
      <DailyClose
        visible={showDailyClose}
        onClose={() => setShowDailyClose(false)}
        onDismiss={() => {
          dismissClosePrompt();
          setShowDailyClose(false);
        }}
      />
    </div>
  );
}
