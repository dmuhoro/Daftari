import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronRight, Mail } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import Card from '../ui/Card';
import Toggle from '../ui/Toggle';

export default function PrivacySection() {
  const { t, language } = useTranslation();
  const telemetryEnabled = useStore((s) => s.telemetryEnabled);
  const setTelemetryEnabled = useStore((s) => s.setTelemetryEnabled);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-1 py-2"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <p className="text-xs font-medium text-muted uppercase tracking-widest dark:text-stone-400">
            {t('privacy_and_data')}
          </p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted dark:text-stone-400" /> : <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />}
      </button>

      {open && (
        <Card padding="p-4" className="space-y-4">
          <p className="text-sm text-muted dark:text-stone-400 leading-relaxed">
            {language === 'sw'
              ? 'Data yako ya biashara huhifadhiwa kwenye kifaa chako pekee hadi uingie, kisha husawazishwa kwenye hazina yako ya wavuti yenye usalama. Hatupakia faili za miamala, SMS, au maelezo ya wateja kwa huduma nyingine yoyote.'
              : 'Your business data is stored on your device alone until you sign in, then synced only to your secure private cloud vault. We never upload transaction files, SMS, or customer details to any other service.'}
          </p>
          <Toggle
            checked={telemetryEnabled}
            onChange={setTelemetryEnabled}
            label={t('share_usage_stats')}
            description={t('share_usage_stats_desc')}
            ariaLabel={t('share_usage_stats')}
          />
          <div className="flex items-center gap-3 pt-1">
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-600" />
            </span>
            <span className="text-xs text-muted dark:text-stone-400">
              {language === 'sw'
                ? 'Msaada: tumia ukurasa wa Msaada katika akaunti yako'
                : 'Need help? Use the Help page in the Account section'}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}