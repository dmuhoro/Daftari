import { Globe, LogOut, ChevronRight, User, Building2, Package, Download } from 'lucide-react';
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
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-ink">{business?.name ?? 'Daftari'}</span>
              {business?.category && (
                <p className="text-xs text-muted">{business.category}{business.subcategory ? ` / ${business.subcategory}` : ''}</p>
              )}
            </div>
          </div>

          {/* Products link */}
          {onNavigate && (
            <>
              <div className="h-px bg-border mx-4" />
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-ink">{t('my_products')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Language section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">
          {t('language')}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
          <button
            onClick={() => setLanguage('sw')}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              language === 'sw' ? 'bg-primary-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${language === 'sw' ? 'bg-primary-600' : 'bg-gray-100'}`}>
                <Globe className={`w-4 h-4 ${language === 'sw' ? 'text-white' : 'text-muted'}`} />
              </div>
              <span className={`text-sm font-medium ${language === 'sw' ? 'text-primary-700' : 'text-ink'}`}>
                {t('swahili')}
              </span>
            </div>
            {language === 'sw' && (
              <div className="w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>

          <div className="h-px bg-border mx-4" />

          <button
            onClick={() => setLanguage('en')}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              language === 'en' ? 'bg-primary-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${language === 'en' ? 'bg-primary-600' : 'bg-gray-100'}`}>
                <Globe className={`w-4 h-4 ${language === 'en' ? 'text-white' : 'text-muted'}`} />
              </div>
              <span className={`text-sm font-medium ${language === 'en' ? 'text-primary-700' : 'text-ink'}`}>
                {t('english')}
              </span>
            </div>
            {language === 'en' && (
              <div className="w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* PWA Install section */}
      {canInstall && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            {t('install_daftari')}
          </p>
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <button
              onClick={install}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink">{t('install_daftari')}</span>
                  <p className="text-xs text-muted">{t('open_without_browser')}</p>
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
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">
          Account
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <User className="w-4 h-4 text-muted" />
              </div>
              <span className="text-sm font-medium text-ink">Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>

          <div className="h-px bg-border mx-4" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-danger" />
            </div>
            <span className="text-sm font-medium text-danger">{t('sign_out')}</span>
          </button>
        </div>
      </div>

      {/* Branding */}
      <p className="text-center text-xs text-muted pb-4">{t('made_in_kenya')}</p>
    </div>
  );
}
