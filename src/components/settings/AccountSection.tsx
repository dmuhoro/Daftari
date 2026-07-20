import { useEffect, useState } from 'react';
import { LogOut, User, Calendar, Building2, HelpCircle, Share2, BarChart3, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { generateReferralUrl, shareViaWhatsApp } from '../../lib/referral';
import { track, EVENTS } from '../../lib/analytics';

interface AccountSectionProps {
  onSignOut: () => void;
  onNavigate?: (view: string) => void;
}

export default function AccountSection({ onSignOut, onNavigate }: AccountSectionProps) {
  const { t, language } = useTranslation();
  const business = useStore((s) => s.business);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [userLastSignIn, setUserLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserCreatedAt(user.created_at ?? null);
        setUserLastSignIn(user.last_sign_in_at ?? null);
      }
    });
  }, []);

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date >= today) return t('leo');
    if (date >= yesterday) return t('jana');
    return date.toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function handleSignOut() {
    track(EVENTS.SIGNOUT);
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
        Account
      </p>
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
        {userEmail && (
          <>
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-muted dark:text-stone-400 uppercase tracking-widest mb-2">
                {t('user_profile')}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center dark:bg-primary-900">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">{userEmail}</p>
                  {userCreatedAt && (
                    <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {t('account_created')}: {formatDate(userCreatedAt)}
                    </p>
                  )}
                  {userLastSignIn && (
                    <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {t('last_sign_in')}: {formatDate(userLastSignIn)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          </>
        )}

        {onNavigate ? (
          <button
            onClick={() => onNavigate('profile')}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-stone-800">
                <Building2 className="w-4 h-4 text-muted dark:text-stone-400" />
              </div>
              <span className="text-sm font-medium text-ink dark:text-stone-100">{t('business_profile')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-stone-800">
              <Building2 className="w-4 h-4 text-muted dark:text-stone-400" />
            </div>
            <span className="text-sm font-medium text-ink dark:text-stone-100">{t('business_profile')}</span>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs text-muted dark:text-stone-400">
            {t('signed_in_as') || 'Signed in as'} <span className="font-medium text-ink dark:text-stone-100">{userEmail || '—'}</span>
          </span>
        </div>

        <div className="h-px bg-border mx-4 dark:bg-stone-700" />

        {onNavigate && (
          <button
            onClick={() => onNavigate('help')}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-ink dark:text-stone-100">{language === 'sw' ? 'Msaada' : 'Help'}</span>
          </button>
        )}

        <div className="h-px bg-border mx-4 dark:bg-stone-700" />

        {business && (
          <button
            onClick={() => {
              const url = generateReferralUrl(business.name, business.category);
              shareViaWhatsApp(url, language);
            }}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-amber-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center dark:bg-amber-900">
                <Share2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-ink dark:text-stone-100">
                  {language === 'sw' ? 'Mwambie Rafiki' : 'Tell a Friend'}
                </span>
                <p className="text-xs text-muted dark:text-stone-400">
                  {language === 'sw' ? 'Saidia mfanyabiashara mwenzako' : 'Help a fellow business owner'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
          </button>
        )}

        {import.meta.env.VITE_ADMIN_USER_ID && (
          <>
            <div className="h-px bg-border mx-4 dark:bg-stone-700" />
            <button onClick={() => onNavigate?.('admin')} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-stone-50 transition-colors dark:hover:bg-stone-800">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center dark:bg-purple-900">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-ink dark:text-stone-100">Admin</span>
            </button>
          </>
        )}

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
  );
}
