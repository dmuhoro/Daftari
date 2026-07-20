import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface LowStockAlertProps {
  products: { name: string; stock?: number; low_stock_threshold?: number }[];
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
  const { t } = useTranslation();
  const lowStock = products.filter((p) => {
    if (p.stock === undefined) return false;
    const threshold = p.low_stock_threshold ?? 5;
    return p.stock <= threshold;
  });

  if (lowStock.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-red-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          {t('low_stock_alert') || 'Low stock alert'} ({lowStock.length})
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {lowStock.map((p) => p.name).join(', ')}
        </p>
      </div>
    </div>
  );
}
