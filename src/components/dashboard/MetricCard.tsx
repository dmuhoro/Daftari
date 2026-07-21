import type { ReactNode } from 'react';
import Card from '../ui/Card';

interface MetricCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueClass?: string;
}

export default function MetricCard({ icon, iconBg, label, value, valueClass }: MetricCardProps) {
  return (
    <Card padding="p-4">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-muted dark:text-stone-400">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${valueClass ?? 'text-ink dark:text-stone-100'}`}>{value}</p>
    </Card>
  );
}
