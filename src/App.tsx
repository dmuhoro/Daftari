import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { getAllTransactions, getAllBusinesses, addBusiness, saveTransaction } from './lib/repository';
import { useStore } from './lib/store';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import AuthScreen from './screens/AuthScreen';
import AppShell from './components/AppShell';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoadingScreen from './screens/LoadingScreen';

const IS_E2E = import.meta.env.VITE_E2E === 'true';

function getResolvedTheme(theme: string): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function mapBusiness(biz: import('./lib/db').Business): {
  id: string; local_id?: string; name: string; owner_name?: string;
  currency: string; category?: string; subcategory?: string;
  payment_methods?: string[]; products?: Array<{ id: string; name: string; price: number; cost_price?: number; unit?: string; stock?: number; low_stock_threshold?: number }>;
} {
  return {
    id: biz.user_id ?? biz.local_id ?? String(biz.id ?? ''),
    local_id: biz.local_id,
    name: biz.name,
    owner_name: biz.owner_name,
    currency: biz.currency,
    category: biz.category,
    subcategory: biz.subcategory,
    payment_methods: biz.payment_methods ? JSON.parse(biz.payment_methods) : undefined,
    products: biz.products ? JSON.parse(biz.products) : undefined,
  };
}

export default function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset' | 'recovery'>('signin');
  const [loadingDexie, setLoadingDexie] = useState(true);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const setTransactions = useStore((s) => s.setTransactions);
  const business = useStore((s) => s.business);
  const setBusiness = useStore((s) => s.setBusiness);
  const setBusinesses = useStore((s) => s.setBusinesses);
  const setActiveBusinessId = useStore((s) => s.setActiveBusinessId);
  const activeBusinessId = useStore((s) => s.activeBusinessId);
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

  // Load data from Dexie on mount
  useEffect(() => {
    if (IS_E2E) {
      // E2E mode: bypass auth, seed test data
      (async () => {
        const testBiz = {
          local_id: 'e2e-biz-1',
          name: 'Test Shop',
          owner_name: 'Test Owner',
          currency: 'KES',
          user_id: 'e2e-user',
          category: 'retail',
          subcategory: 'general',
          payment_methods: JSON.stringify(['cash', 'mpesa']),
          products: JSON.stringify([
            { id: 'p1', name: 'Soda', price: 50, stock: 100 },
            { id: 'p2', name: 'Bread', price: 80, stock: 50 },
          ]),
          created_at: new Date().toISOString(),
          synced: 1,
        };
        await addBusiness(testBiz);
        const now = new Date().toISOString();
        const testTxs = [
          { local_id: 'tx-1', type: 'income' as const, category: 'product_sale', source: 'manual', amount: 500, recorded_at: now, synced: 1, business_id: 'e2e-biz-1' },
          { local_id: 'tx-2', type: 'income' as const, category: 'product_sale', source: 'manual', amount: 350, recorded_at: now, synced: 1, business_id: 'e2e-biz-1' },
          { local_id: 'tx-3', type: 'expense' as const, category: 'rent', source: 'manual', amount: 200, recorded_at: now, synced: 1, business_id: 'e2e-biz-1' },
        ];
        for (const tx of testTxs) await saveTransaction(tx);
        setLoadingDexie(false);
        setSession(true);
        const mapped = [{ ...testBiz, id: testBiz.user_id!, payment_methods: JSON.parse(testBiz.payment_methods), products: JSON.parse(testBiz.products) }];
        setBusinesses(mapped);
        setBusiness(mapped[0]);
        setActiveBusinessId(mapped[0].id);
        setLoadingBusiness(false);
      })();
      return;
    }

    getAllTransactions().then(result => {
      if (result.ok) setTransactions(result.value);
      setLoadingDexie(false);
    });

    if (!IS_E2E) {
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
    }
  }, [setTransactions, setBusiness]);

  // Load businesses from Dexie when session changes
  useEffect(() => {
    if (IS_E2E) return; // E2E seeds data in the first useEffect

    if (session) {
      setLoadingBusiness(true);
      getAllBusinesses().then(result => {
        const bizList = result.ok ? result.value : [];
        const mapped = bizList.map(mapBusiness);
        setBusinesses(mapped);
        // Set active business: prefer stored activeBusinessId, fallback to first
        const storedId = activeBusinessId;
        const target = storedId ? mapped.find(b => b.id === storedId) : mapped[0];
        if (target) {
          setBusiness(target);
          setActiveBusinessId(target.id);
        } else {
          setBusiness(null);
          setActiveBusinessId(null);
        }
        setLoadingBusiness(false);
      });
    } else {
      setBusiness(null);
      setLoadingBusiness(false);
    }
  }, [session, activeBusinessId, setBusiness, setBusinesses, setActiveBusinessId]);

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
        <AppShell onSignOut={() => setSession(false)} />
      )}
      </ToastProvider>
    </ErrorBoundary>
  );
}
