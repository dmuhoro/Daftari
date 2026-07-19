import { useTranslation } from '../hooks/useTranslation';

export default function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-background dark:bg-stone-950 flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
        <span className="text-white text-2xl font-black">D</span>
      </div>
      <p className="text-sm text-muted dark:text-stone-400">{t('loading')}</p>
    </div>
  );
}
