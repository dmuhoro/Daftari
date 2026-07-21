import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import { cents } from '../lib/money';

const SW_MONTHS = ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

interface MonthlyReportScreenProps {
  onBack: () => void;
}

export default function MonthlyReportScreen({ onBack }: MonthlyReportScreenProps) {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const months = language === 'sw' ? SW_MONTHS : EN_MONTHS;

  const monthTxs = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.recorded_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [transactions, year, month]);

  const prevMonth = useMemo(() => {
    const d = new Date(year, month - 1, 1);
    return transactions.filter((tx) => {
      const dt = new Date(tx.recorded_at);
      return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth();
    });
  }, [transactions, year, month]);

  const revenue = useMemo(
    () => cents(monthTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)),
    [monthTxs]
  );
  const expenses = useMemo(
    () => cents(monthTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)),
    [monthTxs]
  );
  const withdrawals = useMemo(
    () => cents(monthTxs.filter((tx) => tx.type === 'withdrawal').reduce((s, tx) => s + tx.amount, 0)),
    [monthTxs]
  );
  const profit = cents(revenue - expenses - withdrawals);

  const prevRevenue = useMemo(
    () => cents(prevMonth.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)),
    [prevMonth]
  );
  const prevExpenses = useMemo(
    () => cents(prevMonth.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)),
    [prevMonth]
  );
  const prevProfit = cents(prevRevenue - prevExpenses);

  const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1) : '—';
  const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses * 100).toFixed(1) : '—';
  const profitChange = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit) * 100).toFixed(1) : '—';

  const categoryData = useMemo(() => {
    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, number> = {};
    for (const tx of monthTxs) {
      if (tx.type === 'income') {
        incomeByCat[tx.category] = cents((incomeByCat[tx.category] || 0) + tx.amount);
      } else if (tx.type === 'expense') {
        expenseByCat[tx.category] = cents((expenseByCat[tx.category] || 0) + tx.amount);
      }
    }
    const incomeCats = Object.entries(incomeByCat)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    const expenseCats = Object.entries(expenseByCat)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    return { incomeCats, expenseCats };
  }, [monthTxs]);

  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay: Record<string, { revenue: number; expenses: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      byDay[key] = { revenue: 0, expenses: 0 };
    }
    for (const tx of monthTxs) {
      const key = tx.recorded_at.slice(0, 10);
      if (byDay[key]) {
        if (tx.type === 'income') byDay[key].revenue = cents(byDay[key].revenue + tx.amount);
        else if (tx.type === 'expense') byDay[key].expenses = cents(byDay[key].expenses + tx.amount);
      }
    }
    return Object.entries(byDay).map(([date, data]) => ({
      date: new Date(date + 'T12:00:00').getDate().toString(),
      profit: cents(data.revenue - data.expenses),
    }));
  }, [monthTxs, year, month]);

  const COLORS = ['#16a34a', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  function navigateMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const hasData = monthTxs.length > 0;

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">
              {language === 'sw' ? 'Ripoti ya Mwezi' : 'Monthly Report'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Month navigator */}
        <Card padding="p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigateMonth(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800">
              <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <span className="text-base font-bold text-ink dark:text-stone-100">
                {months[month]} {year}
              </span>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              disabled={year === now.getFullYear() && month === now.getMonth()}
            >
              <ChevronRight className="w-5 h-5 text-ink dark:text-stone-100" />
            </button>
          </div>
        </Card>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted dark:text-stone-400" />
            </div>
            <p className="text-base font-semibold text-ink dark:text-stone-100">
              {language === 'sw' ? 'Hakuna miamala mwezi huu' : 'No transactions this month'}
            </p>
          </div>
        ) : (
          <>
            {/* Profit card */}
            <div className={`rounded-2xl p-6 shadow-lg ${profit > 0 ? 'bg-primary-600' : profit < 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
              <p className="text-white/80 text-sm font-medium mb-1">
                {language === 'sw' ? 'Faida ya Mwezi' : 'Monthly Profit'}
              </p>
              <p className="text-white text-4xl font-bold tracking-tight">{fmtKES(profit)}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  {profit >= 0 ? <TrendingUp className="w-4 h-4 text-white/70" /> : <TrendingDown className="w-4 h-4 text-white/70" />}
                  <span className="text-white/70 text-xs">
                    {language === 'sw' ? 'Mwezi uliopita: ' : 'Last month: '}
                    {profitChange !== '—' ? `${profitChange}%` : profitChange}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card padding="p-3">
                <p className="text-xs text-muted dark:text-stone-400">{t('revenue')}</p>
                <p className="text-sm font-bold text-primary-600 mt-0.5">{fmtKES(revenue)}</p>
                {revenueChange !== '—' && (
                  <p className={`text-xs mt-0.5 ${Number(revenueChange) >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                    {revenueChange}%
                  </p>
                )}
              </Card>
              <Card padding="p-3">
                <p className="text-xs text-muted dark:text-stone-400">{t('expenses')}</p>
                <p className="text-sm font-bold text-danger mt-0.5">{fmtKES(expenses)}</p>
                {expenseChange !== '—' && (
                  <p className={`text-xs mt-0.5 ${Number(expenseChange) <= 0 ? 'text-primary-600' : 'text-danger'}`}>
                    {expenseChange}%
                  </p>
                )}
              </Card>
              <Card padding="p-3">
                <p className="text-xs text-muted dark:text-stone-400">{t('withdrawal')}</p>
                <p className="text-sm font-bold text-amber-500 mt-0.5">{fmtKES(withdrawals)}</p>
              </Card>
            </div>

            {/* Daily profit bar chart */}
            <Card padding="p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-muted dark:text-stone-400" />
                <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
                  {language === 'sw' ? 'Faida Kila Siku' : 'Daily Profit'}
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} barCategoryGap="10%">
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value) => [`KES ${Number(value).toLocaleString('en-KE')}`, language === 'sw' ? 'Faida' : 'Profit']}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
                      {dailyData.map((d, i) => (
                        <Cell key={i} fill={d.profit >= 0 ? '#16a34a' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryData.incomeCats.length > 0 && (
                <Card padding="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChartIcon className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
                      {language === 'sw' ? 'Mapato kwa Aina' : 'Revenue by Category'}
                    </span>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData.incomeCats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                          {categoryData.incomeCats.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString('en-KE')}`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    {categoryData.incomeCats.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-ink dark:text-stone-100">{cat.name}</span>
                        </div>
                        <span className="font-medium text-ink dark:text-stone-100">{fmtKES(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {categoryData.expenseCats.length > 0 && (
                <Card padding="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChartIcon className="w-4 h-4 text-danger" />
                    <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
                      {language === 'sw' ? 'Gharama kwa Aina' : 'Expenses by Category'}
                    </span>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData.expenseCats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                          {categoryData.expenseCats.map((_, i) => (
                            <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString('en-KE')}`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    {categoryData.expenseCats.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                          <span className="text-ink dark:text-stone-100">{cat.name}</span>
                        </div>
                        <span className="font-medium text-ink dark:text-stone-100">{fmtKES(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}