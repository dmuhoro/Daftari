import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const FALLBACK_LANG = typeof window !== 'undefined'
  ? (localStorage.getItem('daftari-language') as 'sw' | 'en' | null) ?? 'sw'
  : 'sw';

const STRINGS = {
  sw: {
    title: 'Hitilafu imetokea. Bonyeza kuanza upya.',
    restart: 'Anza Upya',
  },
  en: {
    title: 'Something went wrong. Tap to restart.',
    restart: 'Restart',
  },
} as const;

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Daftari] ErrorBoundary caught:', error.message, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const lang = typeof window !== 'undefined'
        ? (localStorage.getItem('daftari-language') as 'sw' | 'en' | null) ?? FALLBACK_LANG
        : FALLBACK_LANG;
      const s = STRINGS[lang];

      return (
        <div className="min-h-dvh bg-stone-50 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-6">
            <span className="text-white text-2xl font-black">D</span>
          </div>
          <p className="text-stone-900 text-base font-medium text-center mb-8 max-w-xs">
            {s.title}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.handleRestart}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-base font-semibold transition-colors"
            >
              {s.restart}
            </button>
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl border border-stone-300 text-stone-600 text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              {lang === 'sw' ? 'Jaribu tena' : 'Try again'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
