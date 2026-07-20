import { Package } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

function fmtKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

interface ProductProfitItem {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  margin: number;
  qty: number;
}

interface ProductProfitListProps {
  data: ProductProfitItem[];
}

export default function ProductProfitList({ data }: ProductProfitListProps) {
  const { language } = useTranslation();

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-card border border-border dark:border-stone-700">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-primary-600" />
        <span className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
          {language === 'sw' ? 'Faida kwa Bidhaa' : 'Product Profitability'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-ink dark:text-stone-100 truncate font-medium">{p.name}</span>
              <span className="text-xs text-muted dark:text-stone-400 flex-shrink-0">x{p.qty}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-muted dark:text-stone-400">{fmtKES(p.cost)}</span>
              <span className={`text-xs font-semibold ${p.margin >= 0 ? 'text-primary-600' : 'text-danger'}`} aria-label={p.margin >= 0 ? `Gain ${fmtKES(p.margin)}` : `Loss ${fmtKES(p.margin)}`}>
                {p.margin >= 0 ? (language === 'sw' ? 'Faida ' : 'Profit ') : (language === 'sw' ? 'Hasara ' : 'Loss ')}
                {p.margin >= 0 ? '+' : ''}{fmtKES(p.margin)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
