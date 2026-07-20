import { ClipboardList, Plus } from 'lucide-react';

interface EmptyStateProps {
  emptyTitle: string;
  emptyDesc: string;
}

export default function EmptyState({ emptyTitle, emptyDesc }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-muted dark:text-stone-400" />
      </div>
      <p className="text-base font-semibold text-ink dark:text-stone-100">{emptyTitle}</p>
      <p className="text-sm text-muted dark:text-stone-400">{emptyDesc}</p>
      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
        <Plus className="w-6 h-6 text-primary-600" strokeWidth={2.5} />
      </div>
    </div>
  );
}
