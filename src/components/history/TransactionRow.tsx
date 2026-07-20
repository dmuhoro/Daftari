import { TrendingUp, TrendingDown, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Transaction } from '../../lib/db';

const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {};

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Taslimu', en: 'Cash' },
  mpesa_send_money: { sw: 'M-Pesa', en: 'M-Pesa' },
  pochi_la_biashara: { sw: 'Pochi', en: 'Pochi' },
  till_number: { sw: 'Till', en: 'Till' },
  paybill: { sw: 'Paybill', en: 'Paybill' },
  airtel_money: { sw: 'Airtel', en: 'Airtel' },
  bank_transfer: { sw: 'Benki', en: 'Bank' },
};

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

function typeIcon(type: string) {
  if (type === 'income') return TrendingUp;
  if (type === 'expense') return TrendingDown;
  return ArrowDownCircle;
}

function typeColor(type: string) {
  if (type === 'income') return 'text-primary-600';
  if (type === 'expense') return 'text-danger';
  return 'text-amber-500';
}

function typeBg(type: string) {
  if (type === 'income') return 'bg-primary-50';
  if (type === 'expense') return 'bg-red-50';
  return 'bg-amber-50';
}

interface TransactionRowProps {
  tx: Transaction;
  isLast: boolean;
  onSelect: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (localId: string) => void;
}

export default function TransactionRow({ tx, isLast, onSelect, onEdit, onDelete }: TransactionRowProps) {
  const { t, language } = useTranslation();
  const Icon = typeIcon(tx.type);
  const color = typeColor(tx.type);
  const bg = typeBg(tx.type);
  const PayIcon = tx.payment_method ? PAYMENT_ICONS[tx.payment_method] : null;

  return (
    <div key={tx.local_id}>
      <div className="flex items-center gap-1 group">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-stone-50 dark:active:bg-stone-800 transition-colors"
          onClick={() => onSelect(tx)}
        >
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">
              {tx.description || (tx.type === 'income' ? t('sale') : tx.type === 'expense' ? t('expense') : t('withdrawal'))}
            </p>
            <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1">
              {tx.category}
              {PayIcon && tx.payment_method && (
                <>
                  <span>·</span>
                  <PayIcon className="w-3 h-3" />
                  <span>{(language === 'sw' ? PAYMENT_LABELS[tx.payment_method]?.sw : PAYMENT_LABELS[tx.payment_method]?.en) ?? tx.payment_method}</span>
                </>
              )}
              <span>·</span>
              {new Date(tx.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <p className={`text-sm font-semibold ${color} flex-shrink-0`}>
            {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
          </p>
        </div>
        <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-muted"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(tx.local_id); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 hover:bg-red-100 text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {!isLast && <div className="h-px bg-border mx-4" />}
    </div>
  );
}
