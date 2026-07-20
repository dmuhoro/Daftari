import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { cents } from '../../lib/money';

interface FulizaSectionProps {
  fulizaTaken: number;
  hasFulizaDebt: boolean;
}

export default function FulizaSection({ fulizaTaken, hasFulizaDebt }: FulizaSectionProps) {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);

  const allFulizaTaken = cents(transactions
    .filter((tx) => tx.type === 'debt_taken')
    .reduce((s, tx) => s + tx.amount, 0));
  const allFulizaRepaid = cents(transactions
    .filter((tx) => tx.type === 'debt_repaid')
    .reduce((s, tx) => s + tx.amount, 0));
  const runningFuliza = cents(allFulizaTaken - allFulizaRepaid);
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
}
