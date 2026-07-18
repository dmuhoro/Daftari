import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { db } from './lib/db';
import { useStore } from './lib/store';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './screens/AuthScreen';
import AppShell from './components/AppShell';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';

function getResolvedTheme(theme: string): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [loadingDexie, setLoadingDexie] = useState(true);
  const setTransactions = useStore((s) => s.setTransactions);
  const business = useStore((s) => s.business);
  const setBusiness = useStore((s) => s.setBusiness);
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
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Load data from Dexie on mount
  useEffect(() => {
    db.open()
      .then(async () => {
        const txs = await db.transactions.orderBy('recorded_at').reverse().toArray();
        setTransactions(txs);
        const biz = await db.business.toCollection().first();
        if (biz) {
          setBusiness({
            id: biz.user_id ?? '',
            name: biz.name,
            owner_name: biz.owner_name,
            currency: biz.currency,
            category: biz.category,
            subcategory: biz.subcategory,
            payment_methods: biz.payment_methods ? JSON.parse(biz.payment_methods) : undefined,
            products: biz.products ? JSON.parse(biz.products) : undefined,
          });
        }
        setLoadingDexie(false);
      })
      .catch(() => setLoadingDexie(false));

    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(!!sess);
    });

    return () => subscription.unsubscribe();
  }, [setTransactions, setBusiness]);

  const handleOnboardingComplete = useCallback(() => {
    db.business.toCollection().first().then((biz) => {
      if (biz) {
        setBusiness({
          id: biz.user_id ?? '',
          name: biz.name,
          currency: biz.currency,
          category: biz.category,
          subcategory: biz.subcategory,
          payment_methods: biz.payment_methods ? JSON.parse(biz.payment_methods) : undefined,
          products: biz.products ? JSON.parse(biz.products) : undefined,
        });
      }
    });
  }, [setBusiness]);

  if (session === null || loadingDexie) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
          <span className="text-white text-2xl font-black">D</span>
        </div>
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  const needsOnboarding = session && business && !business.category;

  return (
    <ErrorBoundary>
      {!session ? (
        showSignIn ? (
          <AuthScreen onAuth={() => setSession(true)} />
        ) : (
          <LandingScreen
            onSignUp={() => setShowSignIn(true)}
            onSignIn={() => setShowSignIn(true)}
          />
        )
      ) : needsOnboarding || !business?.category ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : (
        <AppShell onSignOut={() => setSession(false)} />
      )}
    </ErrorBoundary>
  );
}
