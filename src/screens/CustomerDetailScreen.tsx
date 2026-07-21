import { useState } from 'react';
import { ChevronLeft, TrendingUp, TrendingDown, ArrowDownCircle, Phone, MessageCircle, Smartphone, Wallet, Store, Building2, Banknote, Search } from 'lucide-react';
import { useTranslation, type TranslationKey } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import TextField from '../components/ui/TextField';
import { cents } from '../lib/money';
import type { Customer } from '../lib/db';

const PAYMENT_ICONS: Record<string, typeof Smartphone> = {
  cash: Banknote, mpesa_send_money: Smartphone, pochi_la_biashara: Wallet,
  till_number: Store, paybill: Building2, airtel_money: Smartphone, bank_transfer: Wallet,
};

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  cash: { sw: 'Taslimu', en: 'Cash' }, mpesa_send_money: { sw: 'M-Pesa', en: 'M-Pesa' },
  pochi_la_biashara: { sw: 'Pochi', en: 'Pochi' }, till_number: { sw: 'Till', en: 'Till' },
  paybill: { sw: 'Paybill', en: 'Paybill' }, airtel_money: { sw: 'Airtel', en: 'Airtel' },
  bank_transfer: { sw: 'Benki', en: 'Bank' },
};

function fmt(n: number) { return `KES ${n.toLocaleString('en-KE')}`; }

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

function typeLabel(type: string, t: (key: TranslationKey) => string) {
  if (type === 'income') return t('sale');
  if (type === 'expense') return t('expense');
  return t('withdrawal');
}

interface CustomerDetailScreenProps {
  customer: Customer;
  onBack: () => void;
}

export default function CustomerDetailScreen({ customer, onBack }: CustomerDetailScreenProps) {
  const { t, language } = useTranslation();
  const allTransactions = useStore((s) => s.transactions);
  const [search, setSearch] = useState('');

  const customerTxs = allTransactions.filter(
    (tx) => tx.mpesa_sender?.toLowerCase() === customer.name.toLowerCase()
  );
  const sortedTxs = [...customerTxs].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  const filtered = search
    ? sortedTxs.filter((tx) =>
        (tx.description && tx.description.toLowerCase().includes(search.toLowerCase())) ||
        tx.amount.toString().includes(search)
      )
    : sortedTxs;

  const totalSpent = cents(customerTxs
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + tx.amount, 0));

  const lastVisit = customerTxs.length > 0
    ? new Date(customerTxs[0].recorded_at).toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

  function handleDial() {
    if (customer.phone) {
      window.open(`tel:${customer.phone}`, '_blank');
    }
  }

  function handleWhatsApp() {
    if (customer.phone) {
      window.open(`https://wa.me/${customer.phone.replace(/^0/, '254')}`, '_blank');
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{customer.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base truncate">{customer.name}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Customer profile card */}
        <Card padding="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-ink dark:text-stone-100 truncate">{customer.name}</p>
              <p className="text-sm text-muted dark:text-stone-400">
                {customer.total_visits} {customer.total_visits === 1 ? (t('visit') || 'visit') : (t('visits') || 'visits')}
              </p>
              <p className="text-xs text-muted dark:text-stone-400 mt-0.5">
                {language === 'sw' ? 'Mwisho: ' : 'Last: '}{lastVisit}
              </p>
            </div>
          </div>

          {customer.phone && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDial}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
              >
                <Phone className="w-4 h-4" />
                {language === 'sw' ? 'Piga' : 'Call'}
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="p-4">
            <p className="text-xs text-muted dark:text-stone-400">{t('total') || 'Total'}</p>
            <p className="text-xl font-bold text-primary-600 mt-1">{fmt(totalSpent)}</p>
          </Card>
          <Card padding="p-4">
            <p className="text-xs text-muted dark:text-stone-400">{t('visits') || 'Visits'}</p>
            <p className="text-xl font-bold text-ink dark:text-stone-100 mt-1">{customer.total_visits}</p>
          </Card>
          <Card padding="p-4">
            <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Pointi' : 'Points'}</p>
            <p className="text-xl font-bold text-amber-500 mt-1">{customer.loyalty_points ?? 0}</p>
          </Card>
        </div>

        {/* Search transactions */}
        {customerTxs.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted dark:text-stone-400" />
            <TextField
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'sw' ? 'Tafuta kiasi, maelezo...' : 'Search amount, description...'}
              icon
            />
          </div>
        )}

        {/* Transaction history */}
        {filtered.length > 0 ? (
          <Card padding="none" overflow>
            <div className="px-4 py-3 border-b border-border dark:border-stone-700">
              <p className="text-xs font-semibold text-muted dark:text-stone-400 uppercase tracking-widest">
                {language === 'sw' ? 'Historia ya Miamala' : 'Transaction History'} ({filtered.length})
              </p>
            </div>
            {filtered.map((tx) => {
              const Icon = typeIcon(tx.type);
              const color = typeColor(tx.type);
              const bg = typeBg(tx.type);
              const PayIcon = tx.payment_method ? PAYMENT_ICONS[tx.payment_method] : null;
              return (
                <div key={tx.local_id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">
                      {tx.description || typeLabel(tx.type, t)}
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
                      {new Date(tx.recorded_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${color} flex-shrink-0`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                </div>
              );
            })}
          </Card>
        ) : customerTxs.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted dark:text-stone-400">
              {language === 'sw' ? 'Hakuna miamala inayolingana' : 'No matching transactions'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted dark:text-stone-400">
              {language === 'sw' ? 'Hakuna miamala bado' : 'No transactions yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
