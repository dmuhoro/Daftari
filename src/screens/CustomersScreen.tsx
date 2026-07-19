import { useState, useEffect } from 'react';
import { Users, ChevronLeft, Search, Plus, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { db, type Customer } from '../lib/db';
import { track, EVENTS } from '../lib/analytics';
import CustomerDetailScreen from './CustomerDetailScreen';

interface CustomersScreenProps {
  onBack: () => void;
}

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

export default function CustomersScreen({ onBack }: CustomersScreenProps) {
  const { t, language } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');

  function loadCustomers() {
    db.customers.orderBy('total_spent').reverse().toArray().then((result) => {
      setCustomers(result);
      setLoading(false);
    });
  }

  useEffect(() => {
    track(EVENTS.CUSTOMER_LIST_VIEWED);
    loadCustomers();
  }, []);

  const filtered = search
    ? customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : customers;

  async function handleAddCustomer() {
    if (!addName.trim()) return;
    await db.customers.add({
      name: addName.trim(),
      phone: addPhone.trim() || undefined,
      total_visits: 0,
      total_spent: 0,
      last_visit: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    setAddName('');
    setAddPhone('');
    setShowAdd(false);
    loadCustomers();
  }

  if (selectedCustomer) {
    return (
      <CustomerDetailScreen
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
      />
    );
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
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('wateja_wangu') || 'Customers'}</span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Plus className="w-5 h-5 text-primary-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted dark:text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tafuta_mteja') || 'Search customer...'}
            className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 pl-10 pr-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted dark:text-stone-400">{t('loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Users className="w-7 h-7 text-muted dark:text-stone-400" />
            </div>
            <p className="text-sm text-muted dark:text-stone-400">{t('hakuna_wateja') || 'No customers yet'}</p>
            <p className="text-xs text-muted dark:text-stone-400">{t('wateja_wataonekana') || 'Customers from M-Pesa transactions will appear here'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
              {filtered.length} {t('wateja') || 'customers'}
            </p>
            {filtered.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-sm px-4 py-3.5 flex items-center gap-3 cursor-pointer active:bg-stone-50 dark:active:bg-stone-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">{customer.name}</p>
                  <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-2">
                    <span>{customer.total_visits} {customer.total_visits === 1 ? (t('visit') || 'visit') : (t('visits') || 'visits')}</span>
                    {(customer.loyalty_points ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-500 font-medium">
                        <span className="text-[10px]">★</span> {customer.loyalty_points}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary-600">{fmt(customer.total_spent)}</p>
                  <p className="text-xs text-muted dark:text-stone-400">{t('total') || 'Total'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add customer modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-ink dark:text-stone-100">
                {language === 'sw' ? 'Ongeza Mteja' : 'Add Customer'}
              </span>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800">
                <X className="w-5 h-5 text-muted dark:text-stone-400" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={language === 'sw' ? 'Jina la mteja' : 'Customer name'}
                className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <input
                type="tel"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder={language === 'sw' ? 'Nambari ya simu (si lazima)' : 'Phone number (optional)'}
                className="w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={handleAddCustomer}
                disabled={!addName.trim()}
                className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {language === 'sw' ? 'Ongeza' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
