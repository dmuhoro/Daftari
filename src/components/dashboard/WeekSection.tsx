import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { cents } from '../../lib/money';

const SW_DAYS_SHORT = ['Jpl', 'Jt', 'Jn', 'Jt', 'Al', 'Ij', 'Jm'];

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

function getNairobiToday(): string {
  const now = new Date();
  const nairobi = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
  return nairobi.toISOString().slice(0, 10);
}

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

interface WeekDataPoint {
  date: string;
  day: string;
  profit: number;
  revenue: number;
  expenses: number;
}

export default function WeekSection() {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const weekDates = useMemo(() => getWeekDates(), []);

  const [, setCurrentDateStr] = useState('');
  useEffect(() => { setCurrentDateStr(getNairobiToday()); }, []);

  const getDayName = (dateStr: string, short = false) => {
    const date = new Date(dateStr + 'T12:00:00');
    if (language === 'sw' && short) return SW_DAYS_SHORT[date.getDay()];
    if (language === 'sw') return ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'][date.getDay()];
    return date.toLocaleDateString('en-KE', { weekday: short ? 'short' : 'long' });
  };

  const weekData: WeekDataPoint[] = weekDates.map((date) => {
    const dayTxs = transactions.filter((tx) => tx.recorded_at.slice(0, 10) === date);
    const revenue = cents(dayTxs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0));
    const expenses = cents(dayTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0));
    const withdrawals = cents(dayTxs.filter((tx) => tx.type === 'withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
    const profit = cents(revenue - expenses - withdrawals);
    return { date, day: getDayName(date, true), profit, revenue, expenses };
  });

  const weekRevenue = cents(weekData.reduce((sum, d) => sum + d.revenue, 0));
  const weekExpenses = cents(weekData.reduce((sum, d) => sum + d.expenses, 0));
  const weekProfit = cents(weekData.reduce((sum, d) => sum + d.profit, 0));
  const bestDay = weekData.reduce((best, d) => d.profit > best.profit ? d : best, weekData[0]);
  const weekHasData = weekData.some((d) => d.revenue > 0 || d.expenses > 0);

  const weekProfitBg = weekProfit > 0 ? 'bg-primary-600' : weekProfit < 0 ? 'bg-red-500' : 'bg-amber-500';

  if (!weekHasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-muted dark:text-stone-400" />
        </div>
        <p className="text-base font-semibold text-ink dark:text-stone-100">{t('no_transactions_history')}</p>
        <p className="text-sm text-muted dark:text-stone-400">{t('transactions_will_appear')}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${weekProfitBg} rounded-2xl p-6 shadow-lg`}>
        <p className="text-white/80 text-sm font-medium mb-1">{t('wiki_faida')}</p>
        <p className="text-white text-4xl font-bold tracking-tight" aria-label={weekProfit >= 0 ? `${language === 'sw' ? 'Faida' : 'Profit'} ${fmtKES(weekProfit)}` : `${language === 'sw' ? 'Hasara' : 'Loss'} ${fmtKES(weekProfit)}`}>
          <span className="text-lg font-medium align-middle mr-2">{weekProfit >= 0 ? (language === 'sw' ? 'Faida' : 'Profit') : (language === 'sw' ? 'Hasara' : 'Loss')}</span>
          {fmtKES(weekProfit)}
        </p>
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
          <p className={`text-sm font-bold mt-0.5 ${weekProfit >= 0 ? 'text-primary-600' : 'text-danger'}`} aria-label={weekProfit >= 0 ? `${language === 'sw' ? 'Faida' : 'Profit'} ${fmtKES(weekProfit)}` : `${language === 'sw' ? 'Hasara' : 'Loss'} ${fmtKES(weekProfit)}`}>
            <span>{weekProfit >= 0 ? (language === 'sw' ? 'Faida ' : 'Profit ') : (language === 'sw' ? 'Hasara ' : 'Loss ')}</span>
            {fmtKES(weekProfit)}
          </p>
        </div>
      </div>
    </>
  );
}
