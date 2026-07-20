import { Trash2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({ onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t, language } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-base font-bold text-ink dark:text-stone-100">
              {language === 'sw' ? 'Futa miamala hii?' : 'Delete this transaction?'}
            </p>
            <p className="text-sm text-muted dark:text-stone-400 mt-1">
              {language === 'sw' ? 'Huwezi kurejesha tena.' : 'This cannot be undone.'}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border dark:border-stone-700 text-sm font-semibold text-ink dark:text-stone-100"
            >
              {t('cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
            >
              {language === 'sw' ? 'Futa' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
