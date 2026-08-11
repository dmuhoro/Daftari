import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { getTransactionsForUser, getBusinessesForUser } from './lib/repository';
import { useStore } from './lib/store';
import { mapBusinessToStore, resolveActiveBusiness } from './lib/businessId';
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
  const setTransactions = useStore((s) => s.setTransactions);
  const business = useStore((s) => s.business);
  const setBusiness = useStore((s) => s.setBusiness);
  const setBusinesses = useStore((s) => s.setBusinesses);
  const setActiveBusinessId = useStore((s) => s.setActiveBusinessId);
  const clearSessionState = useStore((s) => s.clearSessionState);
  const getPreferredBusinessId = useStore((s) => s.getPreferredBusinessId);
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

        const [txResult, bizResult] = await Promise.all([
          getTransactionsForUser(user.id),
          getBusinessesForUser(user.id),
        ]);

        if (txResult.ok) setTransactions(txResult.value);
        setLoadingDexie(false);

        const mapped = (bizResult.ok ? bizResult.value : []).map(mapBusinessToStore);
        setBusinesses(mapped);

        const preferredId = getPreferredBusinessId(user.id);
        const target = resolveActiveBusiness(mapped, preferredId);
        if (target) {
          setBusiness(target);
          setActiveBusinessId(target.id, user.id);
        } else {
          setBusiness(null);
          setActiveBusinessId(null);
        }
        setLoadingBusiness(false);
      })();
    } else {
      clearSessionState();
      setLoadingBusiness(false);
      setLoadingDexie(false);
    }
  }, [
    session,
    setBusiness,
    setBusinesses,
    setActiveBusinessId,
    setTransactions,
    clearSessionState,
    getPreferredBusinessId,
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
