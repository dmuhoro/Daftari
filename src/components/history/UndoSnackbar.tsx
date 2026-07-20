import { Undo2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface UndoSnackbarProps {
  message: string;
  onUndo: () => void;
}

export default function UndoSnackbar({ message, onUndo }: UndoSnackbarProps) {
  const { language } = useTranslation();

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between bg-stone-900 dark:bg-stone-700 text-white rounded-2xl px-4 py-3 shadow-2xl max-w-lg mx-auto">
      <span className="text-sm">{message}</span>
      <button
        onClick={onUndo}
        className="flex items-center gap-1 text-sm font-semibold text-green-400 hover:text-green-300"
      >
        <Undo2 className="w-4 h-4" />
        {language === 'sw' ? 'Tengua' : 'Undo'}
      </button>
    </div>
  );
}
