import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import Card from '../ui/Card';
import Toggle from '../ui/Toggle';
import { requestNotificationPermission, subscribeToPush, unsubscribeFromPush, getPushStatus, type PushStatus } from '../../lib/pushNotifications';
import { logger } from '../../lib/logger';
import { useToast } from '../../hooks/useToast';

export default function NotificationsSection() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<PushStatus>('unsupported');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getPushStatus().then((s) => { if (active) setStatus(s); });
    return () => { active = false; };
  }, []);

  async function handleToggle(enabled: boolean) {
    setBusy(true);
    try {
      if (enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setStatus('denied');
          toast(language === 'sw' ? 'Ruhusa ya arifa imekataliwa' : 'Notification permission was refused', 'error');
          return;
        }
        const sub = await subscribeToPush();
        if (sub) {
          setStatus('granted');
        } else {
          toast(language === 'sw' ? 'Imeshindwa kusanidi arifa' : 'Could not set up notifications', 'error');
        }
      } else {
        await unsubscribeFromPush();
        setStatus('not-subscribed');
      }
    } catch (cause) {
      logger.warn('settings:push_toggle_failed', { error: cause instanceof Error ? cause.message : String(cause) });
      toast(language === 'sw' ? 'Hitilafu ya arifa' : 'Notification error', 'error');
    }
    setBusy(false);
  }

  const disabled = status === 'unconfigured' || status === 'unsupported' || status === 'denied' || busy;

  return (
    <div>
      <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
        {t('notifications')}
      </p>
      <Card padding="none" overflow>
        {(status === 'unconfigured' || status === 'unsupported') ? (
          <div className="flex items-center gap-3 px-4 py-3.5 opacity-70">
            <span className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-muted" />
            </span>
            <span className="text-xs text-muted dark:text-stone-400">
              {language === 'sw'
                ? 'Arifa za ukumbusho hazipatikani kwenye hili kifaa'
                : 'Reminder notifications are not available on this device'}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 pt-3.5">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-indigo-600" />
              </span>
              <span className="text-sm font-medium text-ink dark:text-stone-100">{t('daily_close_reminders')}</span>
            </div>
            <Toggle
              checked={status === 'granted'}
              onChange={handleToggle}
              disabled={disabled}
              label={status === 'granted' ? t('push_on') : t('push_off')}
              description={status === 'denied'
                ? (language === 'sw' ? 'Ruhusa imekataliwa — washa kwenye mipangilio ya kivinjari' : 'Permission was refused — allow it in browser settings')
                : t('daily_close_reminders_desc')}
              ariaLabel={t('notifications_toggle')}
            />
          </>
        )}
      </Card>
    </div>
  );
}