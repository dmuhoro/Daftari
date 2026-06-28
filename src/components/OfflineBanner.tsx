import { WifiOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function OfflineBanner() {
  const { t } = useTranslation();

  return (
    <div className="bg-amber-500 px-4 py-2.5 flex items-center justify-center gap-2 safe-top">
      <WifiOff className="w-4 h-4 text-white" />
      <p className="text-sm font-medium text-white">{t('offline_mode')}</p>
    </div>
  );
}
