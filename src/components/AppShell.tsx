import { useState, useEffect, lazy, Suspense } from 'react';
import { Home, PlusCircle, ClipboardList, Settings, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import type { TranslationKey } from '../hooks/useTranslation';
import { useSync } from '../hooks/useSync';
import { useStore } from '../lib/store';
import { todayNairobi, nairobiHour } from '../lib/dates';
import DailyClose from '../features/close/DailyClose';
import OfflineBanner from './OfflineBanner';
import ErrorBoundary from './ErrorBoundary';

const DashboardScreen = lazy(() => import('../screens/DashboardScreen'));
const AddScreen = lazy(() => import('../screens/AddScreen'));
const HistoryScreen = lazy(() => import('../screens/HistoryScreen'));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen'));
const ProductCatalogScreen = lazy(() => import('../screens/ProductCatalogScreen'));
const BusinessProfileScreen = lazy(() => import('../screens/BusinessProfileScreen'));
const CustomersScreen = lazy(() => import('../screens/CustomersScreen'));
const MonthlyReportScreen = lazy(() => import('../screens/MonthlyReportScreen'));
const ProductProfitabilityScreen = lazy(() => import('../screens/ProductProfitabilityScreen'));
const SuppliersScreen = lazy(() => import('../screens/SuppliersScreen'));
const PurchaseOrdersScreen = lazy(() => import('../screens/PurchaseOrdersScreen'));
const StockAdjustmentsScreen = lazy(() => import('../screens/StockAdjustmentsScreen'));
const BatchEntryScreen = lazy(() => import('../screens/BatchEntryScreen'));
const PosScreen = lazy(() => import('../screens/PosScreen'));
const HelpScreen = lazy(() => import('../screens/HelpScreen'));
const AdminScreen = lazy(() => import('../screens/AdminScreen'));

const RecordSale = lazy(() => import('../features/transactions/RecordSale'));
const RecordExpense = lazy(() => import('../features/transactions/RecordExpense'));
const RecordWithdrawal = lazy(() => import('../features/transactions/RecordWithdrawal'));
const RecordFulizaDebt = lazy(() => import('../features/transactions/RecordFulizaDebt'));
const RecordFulizaRepaid = lazy(() => import('../features/transactions/RecordFulizaRepaid'));
const SMSParser = lazy(() => import('../features/sms/SMSParser'));

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
  | 'profile'
  | 'customers'
  | 'monthly-report'
  | 'product-profitability'
  | 'suppliers'
  | 'purchase-orders'
  | 'stock-adjustments'
  | 'batch-entry'
  | 'pos'
  | 'help'
  | 'admin';

type BottomTab = 'dashboard' | 'add' | 'history' | 'settings';

interface AppShellProps {
  onSignOut: () => void;
}

function activeTab(view: View): BottomTab {
  if (view.startsWith('add')) return 'add';
  if (view === 'catalog' || view === 'customers' || view === 'monthly-report' || view === 'product-profitability' || view === 'suppliers' || view === 'purchase-orders' || view === 'stock-adjustments' || view === 'batch-entry' || view === 'pos') return 'settings';
  if (view === 'profile') return 'settings';
  return view as BottomTab;
}

function viewTitle(view: View, t: (k: TranslationKey) => string, language: string): string {
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
    case 'customers': return t('wateja_wangu') || 'Customers';
    case 'monthly-report': return t('monthly_report') || 'Monthly Report';
    case 'product-profitability': return 'Product Profitability';
    case 'suppliers': return t('suppliers');
    case 'purchase-orders': return t('purchase_orders');
    case 'stock-adjustments': return t('stock_adjustments');
    case 'batch-entry': return t('batch_entry');
    case 'pos': return t('pos') || 'POS';
    case 'help': return language === 'sw' ? 'Msaada' : 'Help';
    case 'admin': return 'Admin';
  }
}

export default function AppShell({ onSignOut }: AppShellProps) {
  const { t, language } = useTranslation();
  const { isOnline } = useSync();
  const transactions = useStore((s) => s.transactions);
  const lastCloseDate = useStore((s) => s.lastCloseDate);
  const closePromptDismissedAt = useStore((s) => s.closePromptDismissedAt);
  const dismissClosePrompt = useStore((s) => s.dismissClosePrompt);
  const [view, setView] = useState<View>('dashboard');
  const [showDailyClose, setShowDailyClose] = useState(false);

  const tab = activeTab(view);
  const isSubView = view.includes('/');
  const selfManagedViews = new Set<View>([
    'catalog', 'profile', 'monthly-report', 'product-profitability',
    'suppliers', 'purchase-orders', 'stock-adjustments', 'batch-entry',
    'pos', 'help', 'admin',
  ]);
  const hideNav = selfManagedViews.has(view);

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

  const IS_E2E = import.meta.env.VITE_E2E === 'true' || window.location.search.includes('e2e=true') || !!(window as Window & { __E2E__?: boolean }).__E2E__;

  useEffect(() => {
    if (IS_E2E) return;

    function checkDailyClose() {
      const todayStr = todayNairobi();
      const hours = nairobiHour();

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
  }, [IS_E2E, transactions, lastCloseDate, closePromptDismissedAt]);

  return (
    <div className="min-h-dvh flex flex-col bg-background dark:bg-stone-950 max-w-lg mx-auto">
      {!isOnline && <OfflineBanner />}

      {/* Header */}
      {view !== 'dashboard' && view !== 'history' && view !== 'add' && view !== 'settings' && !selfManagedViews.has(view) && !isSubView && (
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
              {viewTitle(view, t, language)}
            </span>
          </div>
        </header>
      )}

      {/* Content */}
      <Suspense fallback={<div className="flex-1" />}>
        <main className="flex-1 overflow-y-auto pb-20 max-w-lg mx-auto">
          {view === 'dashboard' && <ErrorBoundary key="dashboard"><DashboardScreen onNavigate={(v) => setView(v as View)} /></ErrorBoundary>}
          {view === 'add' && (
            <ErrorBoundary key="add"><AddScreen onNavigate={(v) => setView(v)} /></ErrorBoundary>
          )}
          {view === 'add/sale' && (
            <ErrorBoundary key="add-sale"><RecordSale onSave={() => setView('dashboard')} onCancel={() => setView('add')} /></ErrorBoundary>
          )}
          {view === 'add/expense' && (
            <ErrorBoundary key="add-expense"><RecordExpense onSave={() => setView('dashboard')} onCancel={() => setView('add')} /></ErrorBoundary>
          )}
          {view === 'add/withdrawal' && (
            <ErrorBoundary key="add-withdrawal"><RecordWithdrawal onSave={() => setView('dashboard')} onCancel={() => setView('add')} /></ErrorBoundary>
          )}
          {view === 'add/sms' && (
            <ErrorBoundary key="add-sms">
              <SMSParser
                onSave={() => setView('dashboard')}
                onCancel={() => setView('add')}
                onManualEntry={() => setView('add/sale')}
              />
            </ErrorBoundary>
          )}
          {view === 'add/fuliza-debt' && (
            <ErrorBoundary key="add-fuliza-debt"><RecordFulizaDebt onSave={() => setView('dashboard')} onCancel={() => setView('add')} /></ErrorBoundary>
          )}
          {view === 'add/fuliza-repaid' && (
            <ErrorBoundary key="add-fuliza-repaid"><RecordFulizaRepaid onSave={() => setView('dashboard')} onCancel={() => setView('add')} /></ErrorBoundary>
          )}
          {view === 'history' && <ErrorBoundary key="history"><HistoryScreen /></ErrorBoundary>}
          {view === 'settings' && <ErrorBoundary key="settings"><SettingsScreen onSignOut={onSignOut} onNavigate={(v) => setView(v as View)} /></ErrorBoundary>}
          {view === 'catalog' && <ErrorBoundary key="catalog"><ProductCatalogScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'profile' && <ErrorBoundary key="profile"><BusinessProfileScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'customers' && <ErrorBoundary key="customers"><CustomersScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'monthly-report' && <ErrorBoundary key="monthly-report"><MonthlyReportScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'product-profitability' && <ErrorBoundary key="product-profitability"><ProductProfitabilityScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'suppliers' && <ErrorBoundary key="suppliers"><SuppliersScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'purchase-orders' && <ErrorBoundary key="purchase-orders"><PurchaseOrdersScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'stock-adjustments' && <ErrorBoundary key="stock-adjustments"><StockAdjustmentsScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'batch-entry' && <ErrorBoundary key="batch-entry"><BatchEntryScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'pos' && <ErrorBoundary key="pos"><PosScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'help' && <ErrorBoundary key="help"><HelpScreen onBack={() => setView('settings')} /></ErrorBoundary>}
          {view === 'admin' && <ErrorBoundary key="admin"><AdminScreen onBack={() => setView('settings')} /></ErrorBoundary>}
        </main>
      </Suspense>

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
