import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, AlertTriangle, ClipboardList, Plus, Flame, Users, ChevronDown, Package, Check, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { db } from '../lib/db';
import { BUSINESS_CATEGORIES, categoryEmoji, CATEGORY_DASHBOARD_LABELS } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import SyncDot from '../components/SyncDot';
import { useRecordingStreak } from '../hooks/useRecordingStreak';
import { shareViaWhatsApp, formatDailySummaryText } from '../lib/whatsapp';
import { track, EVENTS } from '../lib/analytics';

const SW_DAYS = ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'];
const SW_DAYS_SHORT = ['Jpl', 'Jt', 'Jn', 'Jt', 'Al', 'Ij', 'Jm'];
const SW_MONTHS = ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'];

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

function getTodayNairobi(): string {
  const now = new Date();
  const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
  return nairobi.toISOString().slice(0, 10);
}

function formatDateSw(date: Date): string {
  const day = SW_DAYS[date.getDay()];
  const d = date.getDate();
  const month = SW_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}, ${d} ${month} ${year}`;
}

function formatDateEn(date: Date): string {
  return date.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

type Tab = 'leo' | 'wiki';

interface DashboardScreenProps {
  onNavigate?: (view: string) => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const business = useStore((s) => s.business);
  const businesses = useStore((s) => s.businesses);
  const setBusiness = useStore((s) => s.setBusiness);
  const setActiveBusinessId = useStore((s) => s.setActiveBusinessId);
  const setLanguage = useStore((s) => s.setLanguage);
  const [tab, setTab] = useState<Tab>('leo');
  const [showBizSwitcher, setShowBizSwitcher] = useState(false);
  const { streak } = useRecordingStreak();
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    db.customers.count().then(setCustomerCount).catch(() => {});
  }, [transactions]);

  const products = business?.products ?? [];
  const lowStockProducts = products.filter((p) => {
    if (p.stock === undefined) return false;
    const threshold = p.low_stock_threshold ?? 5;
    return p.stock <= threshold;
  });

  const todayStr = getTodayNairobi();
  const todayDate = new Date();

  const catKey = business?.category as BusinessCategoryKey | undefined;

  const catEmoji = catKey ? categoryEmoji[catKey] : null;
  const catLabel = catKey
    ? language === 'sw'
      ? BUSINESS_CATEGORIES[catKey]?.label.sw
      : BUSINESS_CATEGORIES[catKey]?.label.en
    : null;

  const dashboardLabels = catKey ? CATEGORY_DASHBOARD_LABELS[catKey] : null;

  function getWeekDates(): string[] {
    const dates: string[] = [];
    const now = new Date();
    const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nairobi);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }

  const weekDates = getWeekDates();

  function getDayName(dateStr: string, short = false): string {
    const date = new Date(dateStr + 'T12:00:00');
    if (language === 'sw') {
      return short ? SW_DAYS_SHORT[date.getDay()] : SW_DAYS[date.getDay()];
    }
    return date.toLocaleDateString('en-KE', { weekday: short ? 'short' : 'long' });
  }

  function getWeekData() {
    return weekDates.map((date) => {
      const dayTxs = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === date);
      const revenue = dayTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
      const expenses = dayTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
      const withdrawals = dayTxs.filter((tx) => tx.type === 'withdrawal').reduce((sum, tx) => sum + tx.amount, 0);
      const profit = revenue - expenses - withdrawals;
      return { date, day: getDayName(date, true), profit, revenue, expenses };
    });
  }

  const weekData = getWeekData();
  const weekRevenue = weekData.reduce((sum, d) => sum + d.revenue, 0);
  const weekExpenses = weekData.reduce((sum, d) => sum + d.expenses, 0);
  const weekProfit = weekData.reduce((sum, d) => sum + d.profit, 0);
  const bestDay = weekData.reduce((best, d) => d.profit > best.profit ? d : best, weekData[0]);

  const todayTxs = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === todayStr);

  const revenue = todayTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = todayTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const withdrawals = todayTxs.filter((tx) => tx.type === 'withdrawal').reduce((sum, tx) => sum + tx.amount, 0);
  const profit = revenue - expenses - withdrawals;
  const cashAvailable = revenue - expenses;
  const txCount = todayTxs.length;

  const fulizaTaken = todayTxs.filter((tx) => tx.type === 'debt_taken').reduce((sum, tx) => sum + tx.amount, 0);
  const fulizaRepaid = todayTxs.filter((tx) => tx.type === 'debt_repaid').reduce((sum, tx) => sum + tx.amount, 0);
  const fulizaDebt = fulizaTaken - fulizaRepaid;
  const hasFulizaDebt = fulizaDebt > 0;

  const todayHasData = txCount > 0;
  const weekHasData = weekData.some((d) => d.revenue > 0 || d.expenses > 0);

  const profitBg = profit > 0 ? 'bg-primary-600' : profit < 0 ? 'bg-red-500' : 'bg-amber-500';
  const weekProfitBg = weekProfit > 0 ? 'bg-primary-600' : weekProfit < 0 ? 'bg-red-500' : 'bg-amber-500';

  // Product profitability
  const productProfitData = useMemo(() => {
    const prods = business?.products ?? [];
    const productRevenue: Record<string, { rev: number; cost: number; qty: number }> = {};
    for (const p of prods) {
      productRevenue[p.id] = { rev: 0, cost: 0, qty: 0 };
    }
    const todayStr = getTodayNairobi();
    const todayTxsFull = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === todayStr && tx.type === 'income');
    for (const tx of todayTxsFull) {
      if (tx.product_id && productRevenue[tx.product_id]) {
        productRevenue[tx.product_id].rev += tx.amount;
        productRevenue[tx.product_id].cost += tx.cost_price ?? 0;
        productRevenue[tx.product_id].qty += 1;
      }
    }
    return Object.entries(productRevenue)
      .filter(([, v]) => v.qty > 0)
      .map(([id, v]) => {
        const p = prods.find(p => p.id === id);
        return { id, name: p?.name ?? id, revenue: v.rev, cost: v.cost, margin: v.rev - v.cost, qty: v.qty };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [transactions, business]);

  const formattedDate = language === 'sw' ? formatDateSw(todayDate) : formatDateEn(todayDate);
  const businessName = business?.name ?? 'Daftari';

  const incomeLabel = dashboardLabels ? (language === 'sw' ? dashboardLabels.incomeLabel.sw : dashboardLabels.incomeLabel.en) : t('mapato');
  const expenseLabel = dashboardLabels ? (language === 'sw' ? dashboardLabels.expenseLabel.sw : dashboardLabels.expenseLabel.en) : t('matumizi');
  const emptyTitle = dashboardLabels ? (language === 'sw' ? dashboardLabels.emptyTitle.sw : dashboardLabels.emptyTitle.en) : t('no_today_transactions');
  const emptyDesc = dashboardLabels ? (language === 'sw' ? dashboardLabels.emptyDesc.sw : dashboardLabels.emptyDesc.en) : t('tap_plus_to_start');
  const emptyWeekTitle = dashboardLabels ? (language === 'sw' ? dashboardLabels.emptyWeekTitle.sw : dashboardLabels.emptyWeekTitle.en) : t('no_transactions_history');
  const emptyWeekDesc = dashboardLabels ? (language === 'sw' ? dashboardLabels.emptyWeekDesc.sw : dashboardLabels.emptyWeekDesc.en) : t('transactions_will_appear');

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="relative">
            <div className="flex items-center gap-2">
              {catEmoji && <span className="text-xl">{catEmoji}</span>}
              <button
                onClick={() => setShowBizSwitcher(!showBizSwitcher)}
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

            {/* Business switcher dropdown */}
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
                        setShowBizSwitcher(false);
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
              <button onClick={() => onNavigate('pos')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">{language === 'sw' ? 'POS' : 'POS'}</span>
              </button>
            )}
            <button
              onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 transition-colors"
            >
              <span className={`text-xs font-semibold ${language === 'sw' ? 'text-primary-600' : 'text-muted dark:text-stone-400'}`}>SW</span>
              <span className="text-xs text-muted dark:text-stone-400">/</span>
              <span className={`text-xs font-semibold ${language === 'en' ? 'text-primary-600' : 'text-muted dark:text-stone-400'}`}>EN</span>
            </button>
          </div>
        </div>

        {/* Streak chip */}
        {streak >= 2 && streak < 30 && (
          <div className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-full px-3 py-1 text-sm mt-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium">{t('streak_days_label', { count: streak })}</span>
          </div>
        )}
        {streak >= 30 && (
          <div className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 rounded-full px-3 py-1 text-sm mt-2">
            <span className="text-xs font-medium">{t('streak_milestone', { count: streak })}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Tab Switcher */}
        <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
          <button
            onClick={() => setTab('leo')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              tab === 'leo' ? 'bg-white dark:bg-stone-900 text-ink dark:text-stone-100 shadow-sm' : 'text-muted dark:text-stone-400'
            }`}
          >
            {t('today')}
          </button>
          <button
            onClick={() => setTab('wiki')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              tab === 'wiki' ? 'bg-white dark:bg-stone-900 text-ink dark:text-stone-100 shadow-sm' : 'text-muted dark:text-stone-400'
            }`}
          >
            {t('this_week')}
          </button>
        </div>

        {tab === 'leo' ? (
          todayHasData ? (
            <>
              <div className={`${profitBg} rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
                <p className="text-white/80 text-sm font-medium mb-1">{t('leo_faida')}</p>
                <p className="text-white text-4xl font-bold tracking-tight">{fmtKES(profit)}</p>
                <div className="flex items-center gap-2 mt-3">
                  {profit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-white/70" />
                  )}
                  <span className="text-white/70 text-xs">
                    {t('transactions_today', { count: txCount })}
                  </span>
                </div>
                {todayHasData && (
                  <button
                    onClick={() => {
                      track(EVENTS.DAILY_SUMMARY_SHARED)
                      shareViaWhatsApp(formatDailySummaryText(
                        business?.name || 'Daftari',
                        new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                        revenue,
                        expenses,
                        profit,
                        txCount,
                      ))
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    title={t('share') || 'Share'}
                  >
                    <span className="text-white text-sm font-bold">↗</span>
                  </button>
                )}
              </div>

              {/* Fuliza section */}
              {(() => {
                const allFulizaTaken = transactions
                  .filter((tx) => tx.type === 'debt_taken')
                  .reduce((s, tx) => s + tx.amount, 0);
                const allFulizaRepaid = transactions
                  .filter((tx) => tx.type === 'debt_repaid')
                  .reduce((s, tx) => s + tx.amount, 0);
                const runningFuliza = allFulizaTaken - allFulizaRepaid;
                const hasFulizaHistory = allFulizaTaken > 0;
                const estInterest = Math.round(runningFuliza * 0.05);
                const monthFulizaCost = fulizaTaken > 0 ? Math.round(fulizaTaken * 0.05) : 0;

                if (!hasFulizaHistory && !hasFulizaDebt) return null;

                return (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          {t('fuliza_alert', { amount: runningFuliza.toLocaleString('en-KE') })}
                        </p>
                        {estInterest > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {language === 'sw' ? 'Kadirio la riba: KES ' : 'Est. interest: KES '}{estInterest.toLocaleString('en-KE')}
                          </p>
                        )}
                      </div>
                    </div>
                    {(allFulizaTaken > 0 || allFulizaRepaid > 0) && (
                      <div className="border-t border-amber-200 dark:border-amber-800 px-4 py-2 flex gap-4 text-xs">
                        <span className="text-amber-700 dark:text-amber-400">
                          {language === 'sw' ? 'Jumla kuchukuliwa' : 'Total taken'}: KES {allFulizaTaken.toLocaleString('en-KE')}
                        </span>
                        <span className="text-amber-700 dark:text-amber-400">
                          {language === 'sw' ? 'Jumla kulipwa' : 'Total repaid'}: KES {allFulizaRepaid.toLocaleString('en-KE')}
                        </span>
                      </div>
                    )}
                    {monthFulizaCost > 0 && (
                      <div className="border-t border-amber-200 dark:border-amber-800 px-4 py-2">
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {language === 'sw' ? 'Gharama ya Fuliza leo' : "Today's Fuliza cost"}: ~KES {monthFulizaCost.toLocaleString('en-KE')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {lowStockProducts.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      {t('low_stock_alert') || 'Low stock alert'} ({lowStockProducts.length})
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {lowStockProducts.map((p) => p.name).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-primary-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-muted dark:text-stone-400">{incomeLabel}</p>
                  <p className="text-lg font-bold text-primary-600 mt-0.5">{fmtKES(revenue)}</p>
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900 flex items-center justify-center mb-3">
                    <TrendingDown className="w-5 h-5 text-danger" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs text-muted dark:text-stone-400">{expenseLabel}</p>
                  <p className="text-lg font-bold text-danger mt-0.5">{fmtKES(expenses)}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-info" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted dark:text-stone-400">{t('pesa_iliyobaki')}</p>
                    <p className="text-xl font-bold text-ink dark:text-stone-100 mt-0.5">{fmtKES(cashAvailable)}</p>
                  </div>
                </div>
              </div>

              {customerCount > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted dark:text-stone-400">{t('wateja_wangu') || 'Customers'}</p>
                      <p className="text-xl font-bold text-ink dark:text-stone-100 mt-0.5">{customerCount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product profitability card */}
              {productProfitData.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
                      {language === 'sw' ? 'Faida kwa Bidhaa' : 'Product Profitability'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {productProfitData.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-ink dark:text-stone-100 truncate font-medium">{p.name}</span>
                          <span className="text-xs text-muted dark:text-stone-400 flex-shrink-0">x{p.qty}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-muted dark:text-stone-400">{fmtKES(p.cost)}</span>
                          <span className={`text-xs font-semibold ${p.margin >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                            {p.margin >= 0 ? '+' : ''}{fmtKES(p.margin)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted dark:text-stone-400" />
              </div>
              <p className="text-base font-semibold text-ink dark:text-stone-100">{emptyTitle}</p>
              <p className="text-sm text-muted dark:text-stone-400">{emptyDesc}</p>
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary-600" strokeWidth={2.5} />
              </div>
            </div>
          )
        ) : (
          weekHasData ? (
            <>
              <div className={`${weekProfitBg} rounded-2xl p-6 shadow-lg`}>
                <p className="text-white/80 text-sm font-medium mb-1">{t('wiki_faida')}</p>
                <p className="text-white text-4xl font-bold tracking-tight">{fmtKES(weekProfit)}</p>
                {bestDay.profit > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <TrendingUp className="w-4 h-4 text-white/70" />
                    <span className="text-white/70 text-xs">
                      {t('siku_bora')}: {getDayName(bestDay.date)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-muted dark:text-stone-400" />
                  <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">7 {language === 'sw' ? 'Siku' : 'Days'}</span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekData} barCategoryGap="20%">
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis hide />
                      <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                        {weekData.map((d, i) => (
                          <Cell key={i} fill={d.profit >= 0 ? '#16a34a' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-card border border-border dark:border-stone-700">
                  <p className="text-xs text-muted dark:text-stone-400">{t('revenue')}</p>
                  <p className="text-sm font-bold text-primary-600 mt-0.5">{fmtKES(weekRevenue)}</p>
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-card border border-border dark:border-stone-700">
                  <p className="text-xs text-muted dark:text-stone-400">{t('expenses')}</p>
                  <p className="text-sm font-bold text-danger mt-0.5">{fmtKES(weekExpenses)}</p>
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-card border border-border dark:border-stone-700">
                  <p className="text-xs text-muted dark:text-stone-400">{t('profit')}</p>
                  <p className={`text-sm font-bold mt-0.5 ${weekProfit >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                    {fmtKES(weekProfit)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted dark:text-stone-400" />
              </div>
              <p className="text-base font-semibold text-ink dark:text-stone-100">{emptyWeekTitle}</p>
              <p className="text-sm text-muted dark:text-stone-400">{emptyWeekDesc}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
