import { track, EVENTS } from './analytics';

const CANONICAL_DOMAIN = import.meta.env.VITE_CANONICAL_DOMAIN || 'https://daftari.app';

export function generateReferralUrl(businessName: string, category?: string): string {
  const code = businessName.slice(0, 4).toLowerCase();
  const params = new URLSearchParams({ ref: code, utm_source: 'referral', utm_medium: 'whatsapp' });
  if (category) params.set('cat', category);
  return `${CANONICAL_DOMAIN}?${params.toString()}`;
}

export function shareViaWhatsApp(url: string, language: 'sw' | 'en'): void {
  const message = language === 'sw'
    ? `Nimepata programu nzuri ya biashara — Daftari 📊\nInasaidia kuona faida yako kila siku, bila mtandao.\nJaribu bure: ${url}`
    : `Found a great business app — Daftari 📊\nSee your daily profit clearly, works offline.\nTry free: ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  track(EVENTS.REFERRAL_LINK_SHARED, { url });
}
