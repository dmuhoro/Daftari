import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { db } from './lib/db';
import { useStore } from './lib/store';
import AuthScreen from './screens/AuthScreen';
import AppShell from './components/AppShell';

export default function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const setTransactions = useStore((s) => s.setTransactions);

  useEffect(() => {
    db.open()
      .then(() => db.transactions.orderBy('recorded_at').reverse().toArray())
      .then(setTransactions)
      .catch(console.error);

    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(!!sess);
    });

    return () => subscription.unsubscribe();
  }, [setTransactions]);

  if (session === null) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-primary-600 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuth={() => setSession(true)} />;
  }

  return <AppShell onSignOut={() => setSession(false)} />;
}
