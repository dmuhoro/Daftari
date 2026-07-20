import { useMemo } from 'react';
import { ChevronLeft, Package, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { cents } from '../lib/money';

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#6366f1'];

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

interface ProductProfitabilityScreenProps {
  onBack: () => void;
}

export default function ProductProfitabilityScreen({ onBack }: ProductProfitabilityScreenProps) {
  const { t, language } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const business = useStore((s) => s.business);

  const productData = useMemo(() => {
    const prods = business?.products ?? [];
    if (prods.length === 0) return [];

    const byProduct: Record<string, { revenue: number; cost: number; qty: number; name: string }> = {};
    for (const p of prods) {
      byProduct[p.id] = { revenue: 0, cost: 0, qty: 0, name: p.name };
    }

    const incomeTxs = transactions.filter((tx) => tx.type === 'income' && tx.product_id);
    for (const tx of incomeTxs) {
      if (tx.product_id && byProduct[tx.product_id]) {
        byProduct[tx.product_id].revenue = cents(byProduct[tx.product_id].revenue + tx.amount);
        byProduct[tx.product_id].cost = cents(byProduct[tx.product_id].cost + (tx.cost_price ?? 0));
        byProduct[tx.product_id].qty += 1;
      }
    }

    return Object.values(byProduct)
      .filter((p) => p.qty > 0)
      .map((p) => ({
        ...p,
        margin: cents(p.revenue - p.cost),
        marginPct: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [transactions, business]);

  const totalRevenue = cents(productData.reduce((s, p) => s + p.revenue, 0));
  const totalCost = cents(productData.reduce((s, p) => s + p.cost, 0));
  const totalMargin = cents(totalRevenue - totalCost);

  const chartData = productData.slice(0, 10).map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name,
    margin: p.margin,
    revenue: p.revenue,
  }));

  if (productData.length === 0) {
    return (
      <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
        <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
          <div className="flex items-center h-14 gap-2">
            <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
              <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-ink dark:text-stone-100 text-base">
                {language === 'sw' ? 'Faida kwa Bidhaa' : 'Product Profitability'}
              </span>
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted dark:text-stone-400" />
          </div>
          <p className="text-sm text-muted dark:text-stone-400 text-center px-8">
            {language === 'sw'
              ? 'Bado hakuna mauzo yaliyounganishwa na bidhaa. Rekodi mauzo kutoka kwenye orodha ya bidhaa ili kuona faida kwa kila bidhaa.'
              : 'No product-linked sales yet. Record sales from your product catalog to see per-product profitability.'}
          </p>
        </div>
      </div>
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
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">
              {language === 'sw' ? 'Faida kwa Bidhaa' : 'Product Profitability'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-card border border-border dark:border-stone-700">
            <p className="text-xs text-muted dark:text-stone-400">{t('revenue')}</p>
            <p className="text-sm font-bold text-primary-600 mt-0.5">{fmtKES(totalRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-card border border-border dark:border-stone-700">
            <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Gharama' : 'Cost'}</p>
            <p className="text-sm font-bold text-danger mt-0.5">{fmtKES(totalCost)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-card border border-border dark:border-stone-700">
            <p className="text-xs text-muted dark:text-stone-400">{t('profit')}</p>
            <p className={`text-sm font-bold mt-0.5 ${totalMargin >= 0 ? 'text-primary-600' : 'text-danger'}`}>
              {totalMargin >= 0 ? '+' : ''}{fmtKES(totalMargin)}
            </p>
          </div>
        </div>

        {/* Margin bar chart */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted dark:text-stone-400" />
              <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
                {language === 'sw' ? 'Faida kwa Bidhaa (Juu 10)' : 'Margin by Product (Top 10)'}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" barCategoryGap="15%">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={70} />
                  <Tooltip
                    formatter={(value) => [`KES ${Number(value).toLocaleString('en-KE')}`, language === 'sw' ? 'Faida' : 'Margin']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.margin >= 0 ? COLORS[i % COLORS.length] : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Product list */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border dark:border-stone-700">
            <p className="text-xs font-semibold text-muted dark:text-stone-400 uppercase tracking-widest">
              {language === 'sw' ? 'Maelezo ya Bidhaa' : 'Product Details'} ({productData.length})
            </p>
          </div>
          {productData.map((p) => (
            <div key={p.name} className="flex items-center gap-3 px-4 py-3.5 border-b border-border dark:border-stone-700 last:border-b-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                p.margin >= 0 ? 'bg-primary-50' : 'bg-red-50'
              }`}>
                <Package className={`w-4 h-4 ${p.margin >= 0 ? 'text-primary-600' : 'text-danger'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">{p.name}</p>
                <p className="text-xs text-muted dark:text-stone-400">
                  {p.qty} {language === 'sw' ? 'iliyouzwa' : 'sold'} · {fmtKES(p.cost)} {language === 'sw' ? 'gharama' : 'cost'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${p.margin >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                  {p.margin >= 0 ? '+' : ''}{fmtKES(p.margin)}
                </p>
                <p className={`text-xs ${p.marginPct >= 0 ? 'text-primary-600' : 'text-danger'}`}>
                  {p.marginPct}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
