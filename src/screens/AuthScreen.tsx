import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { BookOpen, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      onAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid') || msg.includes('credentials') || msg.includes('password')) {
        setError(t('error_invalid'));
      } else {
        setError(t('error_generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Language toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
          className="text-xs font-medium text-muted px-3 py-1.5 rounded-full border border-border bg-white hover:bg-primary-50 hover:text-primary-700 transition-colors"
        >
          {language === 'sw' ? 'EN' : 'SW'}
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg mb-4">
              <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">{t('app_name')}</h1>
            <p className="text-muted text-sm mt-1">{t('tagline')}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-card border border-border p-6">
            <h2 className="text-lg font-semibold text-ink mb-5">
              {mode === 'signin' ? t('welcome_back') : t('create_account')}
            </h2>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading
                  ? mode === 'signin'
                    ? t('signing_in')
                    : t('signing_up')
                  : mode === 'signin'
                  ? t('sign_in')
                  : t('sign_up')}
              </button>
            </form>
          </div>

          {/* Toggle mode */}
          <p className="text-center text-sm text-muted mt-5">
            {mode === 'signin' ? t('no_account') : t('have_account')}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              {mode === 'signin' ? t('sign_up') : t('sign_in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
