import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { track, EVENTS } from '../../lib/analytics';
import { shareViaWhatsApp, formatDailySummaryText } from '../../lib/whatsapp';

interface ProfitHeroCardProps {
  profit: number;
  txCount: number;
  revenue: number;
  expenses: number;
  businessName: string;
}

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

export default function ProfitHeroCard({ profit, txCount, revenue, expenses, businessName }: ProfitHeroCardProps) {
  const { t, language } = useTranslation();
  const profitBg = profit > 0 ? 'bg-primary-600' : profit < 0 ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className={`${profitBg} rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
      <p className="text-white/80 text-sm font-medium mb-1">{t('leo_faida')}</p>
      <p className="text-white text-4xl font-bold tracking-tight" aria-label={profit >= 0 ? `${language === 'sw' ? 'Faida' : 'Profit'} ${fmtKES(profit)}` : `${language === 'sw' ? 'Hasara' : 'Loss'} ${fmtKES(profit)}`}>
        <span className="text-lg font-medium align-middle mr-2">{profit >= 0 ? (language === 'sw' ? 'Faida' : 'Profit') : (language === 'sw' ? 'Hasara' : 'Loss')}</span>
        {fmtKES(profit)}
      </p>
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
      <button
        onClick={() => {
          track(EVENTS.DAILY_SUMMARY_SHARED);
          shareViaWhatsApp(formatDailySummaryText(
            businessName,
            new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            revenue,
            expenses,
            profit,
            txCount,
          ));
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        title={t('share') || 'Share'}
      >
        <span className="text-white text-sm font-bold">↗</span>
      </button>
    </div>
  );
}
