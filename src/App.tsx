import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { db } from './lib/db';
import { useStore } from './lib/store';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './screens/AuthScreen';
import AppShell from './components/AppShell';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';

export default function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const setTransactions = useStore((s) => s.setTransactions);
  const business = useStore((s) => s.business);
  const setBusiness = useStore((s) => s.setBusiness);

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
      })
      .catch(console.error);

    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(!!sess);
    });

    return () => subscription.unsubscribe();
  }, [setTransactions, setBusiness]);

  const needsOnboarding = session && business && !business.category;

  return (
    <ErrorBoundary>
      {session === null ? (
        <div className="min-h-dvh bg-background flex items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 animate-pulse" />
        </div>
      ) : !session ? (
        showSignIn ? (
          <AuthScreen onAuth={() => setSession(true)} />
        ) : (
          <LandingScreen
            onSignUp={() => setShowSignIn(true)}
            onSignIn={() => setShowSignIn(true)}
          />
        )
      ) : needsOnboarding ? (
        <OnboardingScreen onComplete={() => setBusiness({ ...business!, category: business?.category ?? '' })} />
      ) : !business?.category ? (
        <OnboardingScreen onComplete={() => {
          db.business.toCollection().first().then((biz) => {
            if (biz) {
              setBusiness({
                id: biz.user_id ?? '',
                name: biz.name,
                currency: biz.currency,
                category: biz.category,
              });
            }
          });
        }} />
      ) : (
        <AppShell onSignOut={() => setSession(false)} />
      )}
    </ErrorBoundary>
  );
}
