import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { countCustomers } from '../lib/repository';
import { cents } from '../lib/money';
import { CATEGORY_DASHBOARD_LABELS } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import { useRecordingStreak } from '../hooks/useRecordingStreak';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ProfitHeroCard from '../components/dashboard/ProfitHeroCard';
import FulizaSection from '../components/dashboard/FulizaSection';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import MetricCard from '../components/dashboard/MetricCard';
import ProductProfitList from '../components/dashboard/ProductProfitList';
import WeekSection from '../components/dashboard/WeekSection';
import EmptyState from '../components/dashboard/EmptyState';

type Tab = 'leo' | 'wiki';

interface DashboardScreenProps {
  onNavigate?: (view: string) => void;
}

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const business = useStore((s) => s.business);
  const [tab, setTab] = useState<Tab>('leo');
  const [showBizSwitcher, setShowBizSwitcher] = useState(false);
  const { streak } = useRecordingStreak();
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    countCustomers().then(r => { if (r.ok) setCustomerCount(r.value); });
  }, [transactions]);

  const products = business?.products ?? [];

  const todayStr = useMemo(() => new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })).toISOString().slice(0, 10), []);
  const todayTxs = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === todayStr);

  const revenue = cents(todayTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0));
  const expenses = cents(todayTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0));
  const withdrawals = cents(todayTxs.filter((tx) => tx.type === 'withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
  const profit = cents(revenue - expenses - withdrawals);
  const cashAvailable = cents(revenue - expenses);
  const txCount = todayTxs.length;

  const fulizaTaken = cents(todayTxs.filter((tx) => tx.type === 'debt_taken').reduce((sum, tx) => sum + tx.amount, 0));
  const hasFulizaDebt = cents(fulizaTaken - cents(todayTxs.filter((tx) => tx.type === 'debt_repaid').reduce((sum, tx) => sum + tx.amount, 0))) > 0;

  const todayHasData = txCount > 0;
  const catKey = business?.category as BusinessCategoryKey | undefined;
  const dashboardLabels = catKey ? CATEGORY_DASHBOARD_LABELS[catKey] : null;

  const incomeLabel = dashboardLabels ? (language === 'sw' ? dashboardLabels.incomeLabel.sw : dashboardLabels.incomeLabel.en) : t('mapato');
  const expenseLabel = dashboardLabels ? (language === 'sw' ? dashboardLabels.expenseLabel.sw : dashboardLabels.expenseLabel.en) : t('matumizi');
  const emptyTitle = dashboardLabels ? (language === 'sw' ? dashboardLabels.emptyTitle.sw : dashboardLabels.emptyTitle.en) : t('no_today_transactions');
  const emptyDesc = dashboardLabels ? (language === 'sw' ? dashboardLabels.emptyDesc.sw : dashboardLabels.emptyDesc.en) : t('tap_plus_to_start');

  const productProfitData = useMemo(() => {
    const prods = business?.products ?? [];
    const productRevenue: Record<string, { rev: number; cost: number; qty: number }> = {};
    for (const p of prods) {
      productRevenue[p.id] = { rev: 0, cost: 0, qty: 0 };
    }
    const todayTxsFull = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === todayStr && tx.type === 'income');
    for (const tx of todayTxsFull) {
      if (tx.product_id && productRevenue[tx.product_id]) {
        productRevenue[tx.product_id].rev = cents(productRevenue[tx.product_id].rev + tx.amount);
        productRevenue[tx.product_id].cost = cents(productRevenue[tx.product_id].cost + (tx.cost_price ?? 0));
        productRevenue[tx.product_id].qty += 1;
      }
    }
    return Object.entries(productRevenue)
      .filter(([, v]) => v.qty > 0)
      .map(([id, v]) => {
        const p = prods.find(p => p.id === id);
        return { id, name: p?.name ?? id, revenue: v.rev, cost: v.cost, margin: cents(v.rev - v.cost), qty: v.qty };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [transactions, business, todayStr]);

  const fmtKES = (n: number) => `KES ${n.toLocaleString('en-KE')}`;

  return (
    <div className="flex flex-col">
      <DashboardHeader
        streak={streak}
        showBizSwitcher={showBizSwitcher}
        onToggleBizSwitcher={() => setShowBizSwitcher(!showBizSwitcher)}
        onSwitchBusiness={() => setShowBizSwitcher(false)}
        onNavigate={onNavigate}
      />

      <div className="flex flex-col gap-4 px-4 py-5">
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
              <ProfitHeroCard
                profit={profit}
                txCount={txCount}
                revenue={revenue}
                expenses={expenses}
                businessName={business?.name ?? 'Daftari'}
              />

              <FulizaSection fulizaTaken={fulizaTaken} hasFulizaDebt={hasFulizaDebt} />
              <LowStockAlert products={products} />

              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5 text-primary-600" strokeWidth={2.5} />}
                  iconBg="bg-primary-50 dark:bg-primary-900"
                  label={incomeLabel}
                  value={fmtKES(revenue)}
                  valueClass="text-lg font-bold text-primary-600 mt-0.5"
                />
                <MetricCard
                  icon={<TrendingDown className="w-5 h-5 text-danger" strokeWidth={2.5} />}
                  iconBg="bg-red-50 dark:bg-red-900"
                  label={expenseLabel}
                  value={fmtKES(expenses)}
                  valueClass="text-lg font-bold text-danger mt-0.5"
                />
              </div>

              <MetricCard
                icon={<Wallet className="w-5 h-5 text-info" strokeWidth={2.5} />}
                iconBg="bg-blue-50 dark:bg-blue-900"
                label={t('pesa_iliyobaki')}
                value={fmtKES(cashAvailable)}
                valueClass="text-xl font-bold text-ink dark:text-stone-100 mt-0.5"
              />

              {customerCount > 0 && (
                <MetricCard
                  icon={<Users className="w-5 h-5 text-purple-600" strokeWidth={2.5} />}
                  iconBg="bg-purple-50 dark:bg-purple-900"
                  label={t('wateja_wangu') || 'Customers'}
                  value={String(customerCount)}
                  valueClass="text-xl font-bold text-ink dark:text-stone-100 mt-0.5"
                />
              )}

              <ProductProfitList data={productProfitData} />
            </>
          ) : (
            <EmptyState emptyTitle={emptyTitle} emptyDesc={emptyDesc} />
          )
        ) : (
          <WeekSection />
        )}
      </div>
    </div>
  );
}
