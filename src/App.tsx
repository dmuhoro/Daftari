import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useStore } from './lib/store';
import { adoptOrphanedRecords } from './features/sync/adoptOrphans';
import { loadTenantState } from './lib/tenantLoader';
import { logger } from './lib/logger';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import AuthScreen from './screens/AuthScreen';
import AppShell from './components/AppShell';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoadingScreen from './screens/LoadingScreen';

const IS_E2E = import.meta.env.VITE_E2E === 'true' || window.location.search.includes('e2e=true') || !!(window as Window & { __E2E__?: boolean }).__E2E__;

function getResolvedTheme(theme: string): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [session, setSession] = useState<boolean | null>(IS_E2E ? true : null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset' | 'recovery'>('signin');
  const [loadingDexie, setLoadingDexie] = useState(!IS_E2E);
  const [loadingBusiness, setLoadingBusiness] = useState(!IS_E2E);
  const business = useStore((s) => s.business);
  const clearSessionState = useStore((s) => s.clearSessionState);
  const theme = useStore((s) => s.theme);

  // Dark mode: apply resolved theme to document
  useEffect(() => {
    const resolved = getResolvedTheme(theme);
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Auth session listener
  useEffect(() => {
    if (IS_E2E) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(!!sess);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('recovery');
        setShowSignIn(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load tenant-scoped data when session changes
  useEffect(() => {
    if (IS_E2E) return;

    if (session) {
      setLoadingBusiness(true);
      setLoadingDexie(true);
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingBusiness(false);
          setLoadingDexie(false);
          return;
        }

        // Claim any records captured before a session existed (sign-up with
        // pending email confirmation, older builds, E2E). Runs BEFORE the
        // tenant-scoped read so orphaned data is visible to its new owner
        // and re-enters the sync path instead of dying in the RLS void.
        try {
          const adopted = await adoptOrphanedRecords(user.id);
          if (adopted.transactions > 0 || adopted.businesses > 0) {
            logger.info('sync:adopted_orphans_on_session', adopted);
          }
        } catch (cause) {
          // Adoption is best-effort healing: a failure must not strand the
          // user on a loading spinner; tenant load below still proceeds.
          logger.warn('sync:adopt_orphans_failed_on_session', { error: cause instanceof Error ? cause.message : String(cause) });
        }

        await loadTenantState(user.id);
        setLoadingDexie(false);
        setLoadingBusiness(false);
      })();
    } else {
      clearSessionState();
      setLoadingBusiness(false);
      setLoadingDexie(false);
    }
  }, [
    session,
    clearSessionState,
  ]);

  function handleSignOut() {
    clearSessionState();
    setSession(false);
  }

  if (session === null || loadingDexie) {
    return <LoadingScreen />;
  }

  if (loadingBusiness && session) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        {!session ? (
        showSignIn ? (
          <AuthScreen onAuth={() => { setSession(true); setAuthMode('signin'); }} mode={authMode} />
        ) : (
          <LandingScreen
            onSignUp={() => { setAuthMode('signup'); setShowSignIn(true); }}
            onSignIn={() => { setAuthMode('signin'); setShowSignIn(true); }}
          />
        )
      ) : !business || !business.category ? (
        <OnboardingScreen onComplete={() => {}} />
      ) : (
        <AppShell onSignOut={handleSignOut} />
      )}
      </ToastProvider>
    </ErrorBoundary>
  );
}
