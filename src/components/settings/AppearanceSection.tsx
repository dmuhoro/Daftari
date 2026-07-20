import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';

export default function AppearanceSection() {
  const { t } = useTranslation();
  const languageStore = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  return (
    <div>
      <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
        {t('appearance_settings')}
      </p>
      <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-4 dark:bg-stone-900 dark:border-stone-700">
        <div>
          <p className="text-xs font-medium text-muted mb-2 dark:text-stone-400">{t('language')}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('sw')}
              className={`flex-1 py-3 rounded-xl border-2 text-center text-sm font-semibold transition-colors ${
                languageStore === 'sw'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
              }`}
            >
              🇰🇪 Kiswahili
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-3 rounded-xl border-2 text-center text-sm font-semibold transition-colors ${
                languageStore === 'en'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted mb-2 dark:text-stone-400">{t('appearance')}</p>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((tm) => {
              const isActive = theme === tm;
              const Icon = tm === 'light' ? Sun : tm === 'dark' ? Moon : Monitor;
              return (
                <button
                  key={tm}
                  onClick={() => setTheme(tm)}
                  className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tm === 'light' ? t('theme_light') : tm === 'dark' ? t('theme_dark') : t('theme_system')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
