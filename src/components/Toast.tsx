import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const iconMap: Record<ToastType, typeof Info> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const colorMap: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 left-4 right-4 z-[100] flex flex-col gap-2 max-w-lg mx-auto pointer-events-none" role="alert" aria-live="polite">
        {toasts.map(t => {
          const Icon = iconMap[t.type];
          return (
            <div key={t.id} className={`${colorMap[t.type]} text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 pointer-events-auto animate-slide-up`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
