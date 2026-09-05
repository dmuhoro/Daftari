import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTranslation } from '../hooks/useTranslation';

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const ipadOS = /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
  return !!(/iP(hone|od|ad)/.test(ua) || ipadOS);
}

export default function InstallBanner() {
  const { t } = useTranslation();
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isAlreadyInstalled()) return null;

  const dismissButton = (
    <button
      onClick={() => setDismissed(true)}
      aria-label={t('dismiss')}
      className="text-white/80 hover:text-white shrink-0"
      data-testid="install-banner-dismiss"
    >
      <X className="w-4 h-4" />
    </button>
  );

  if (canInstall) {
    return (
      <div className="bg-primary-600 px-4 py-2.5 flex items-center justify-between gap-2 safe-top" data-testid="install-banner-cta">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Download className="w-4 h-4 text-white shrink-0" />
          <p className="text-xs font-medium text-white">{t('install_banner')}</p>
        </div>
        <button
          onClick={() => void install()}
          className="bg-white text-primary-700 text-xs font-semibold rounded-lg px-3 py-1.5 whitespace-nowrap"
        >
          {t('install')}
        </button>
        {dismissButton}
      </div>
    );
  }

  if (isIOS()) {
    return (
      <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between gap-2 safe-top" data-testid="install-banner-ios">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Download className="w-4 h-4 text-white shrink-0" />
          <p className="text-xs font-medium text-white">{t('install_banner_ios')}</p>
        </div>
        {dismissButton}
      </div>
    );
  }

  return null;
}