import { LogOut, ChevronRight, User, Building2, Package, Download, Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsScreenProps {
  onSignOut: () => void;
  onNavigate?: (view: string) => void;
}

export default function SettingsScreen({ onSignOut, onNavigate }: SettingsScreenProps) {
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const business = useStore((s) => s.business);
  const { canInstall, install } = usePWAInstall();

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-4">
      {/* Business section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 mt-2">
          {t('business_name')}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center dark:bg-primary-900">
              <Building2 className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-ink dark:text-stone-100">{business?.name ?? 'Daftari'}</span>
              {business?.category && (
                <p className="text-xs text-muted dark:text-stone-400">{business.category}{business.subcategory ? ` / ${business.subcategory}` : ''}</p>
              )}
            </div>
          </div>

          {onNavigate && (
            <>
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center dark:bg-green-900">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('my_products')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Appearance section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {t('appearance_settings')}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-4 dark:bg-stone-900 dark:border-stone-700">
          {/* Language */}
          <div>
            <p className="text-xs font-medium text-muted mb-2 dark:text-stone-400">{t('language')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage('sw')}
                className={`flex-1 py-3 rounded-xl border-2 text-center text-sm font-semibold transition-colors ${
                  language === 'sw'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                }`}
              >
                🇰🇪 Kiswahili
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-3 rounded-xl border-2 text-center text-sm font-semibold transition-colors ${
                  language === 'en'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Theme */}
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

      {/* PWA Install section */}
      {canInstall && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
            {t('install_daftari')}
          </p>
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
            <button
              onClick={install}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-blue-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('install_daftari')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{t('open_without_browser')}</p>
                </div>
              </div>
              <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                {t('install')}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Account section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          Account
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-stone-800">
                <User className="w-4 h-4 text-muted dark:text-stone-400" />
              </div>
              <span className="text-sm font-medium text-ink dark:text-stone-100">Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
          </button>

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors dark:hover:bg-red-950"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center dark:bg-red-900">
              <LogOut className="w-4 h-4 text-danger" />
            </div>
            <span className="text-sm font-medium text-danger">{t('sign_out')}</span>
          </button>
        </div>
      </div>

      {/* Branding */}
      <p className="text-center text-xs text-muted pb-4 dark:text-stone-400">{t('made_in_kenya')}</p>
    </div>
  );
}
