import { useState } from 'react';
import { MessageSquare, CheckCircle, AlertCircle, User, Hash, Banknote, Smartphone, Wallet, Store, Building2, Wifi } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { getCustomerByName, updateCustomer, saveCustomer } from '../../lib/repository';
import { cents } from '../../lib/money';
import { parseMpesaSMS } from './parseMpesa';
import SuccessFlash from '../../components/SuccessFlash';
import { shareViaWhatsApp, formatReceiptText } from '../../lib/whatsapp';
import { track, EVENTS } from '../../lib/analytics';

interface SMSParserProps {
  onSave: () => void;
  onCancel: () => void;
  onManualEntry: () => void;
}

const PAYMENT_ICONS: Record<string, typeof Smartphone> = {
  mpesa_send_money: Smartphone,
  pochi_la_biashara: Wallet,
  till_number: Store,
  paybill: Building2,
  airtel_money: Wifi,
};

const PAYMENT_LABELS: Record<string, { sw: string; en: string }> = {
  mpesa_send_money: { sw: 'M-Pesa', en: 'M-Pesa' },
  pochi_la_biashara: { sw: 'Pochi', en: 'Pochi' },
  till_number: { sw: 'Till', en: 'Till' },
  paybill: { sw: 'Paybill', en: 'Paybill' },
  airtel_money: { sw: 'Airtel', en: 'Airtel' },
};

export default function SMSParser({ onSave, onCancel, onManualEntry }: SMSParserProps) {
  const { t, language } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);

  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseMpesaSMS>>(null);
  const [editAmount, setEditAmount] = useState('');
  const [parseError, setParseError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flashAmount, setFlashAmount] = useState<number | null>(null);
  const [flashReceiptId, setFlashReceiptId] = useState<string | undefined>();
  const [flashSender, setFlashSender] = useState('');

  function handleParse() {
    const result = parseMpesaSMS(smsText);
    if (result) {
      setParsed(result);
      setEditAmount(String(result.amount));
      setParseError(false);
      track(EVENTS.SMS_PARSED)
    } else {
      setParsed(null);
      setParseError(true);
      track(EVENTS.SMS_PARSE_FAILED)
    }
  }

  async function handleConfirm() {
    if (!parsed) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSaving(true);
    const receiptId = await addTransaction({
      local_id: crypto.randomUUID(),
      type: 'income',
      category: 'mpesa',
      source: 'sms',
      amount,
      description: `M-Pesa from ${parsed.sender}`,
      recorded_at: new Date().toISOString(),
      synced: 0,
      mpesa_code: parsed.code,
      mpesa_sender: parsed.sender,
      payment_method: parsed.payment_method,
    });
    setSaving(false);
    setFlashAmount(amount);
    setFlashReceiptId(receiptId);
    setFlashSender(parsed.sender);
    track(EVENTS.TRANSACTION_RECORDED, { type: 'income', method: 'sms' })

    try {
      const existingResult = await getCustomerByName(parsed.sender);
      const now = new Date().toISOString();
      if (existingResult.ok && existingResult.value?.id) {
        await updateCustomer(existingResult.value.id, {
          total_visits: existingResult.value.total_visits + 1,
          total_spent: cents(existingResult.value.total_spent + amount),
          last_visit: now,
        });
      } else {
        await saveCustomer({
          name: parsed.sender,
          phone: parsed.code || undefined,
          total_visits: 1,
          total_spent: amount,
          last_visit: now,
          created_at: now,
        });
      }
    } catch (e) { console.warn('Failed to upsert customer from SMS:', e); }
  }

  if (flashAmount !== null) {
    return (
      <SuccessFlash
        amount={flashAmount}
        type="income"
        onDismiss={onSave}
        receiptId={flashReceiptId}
        description={`M-Pesa from ${flashSender}`}
        onShare={flashReceiptId ? () => {
          shareViaWhatsApp(formatReceiptText(
            'Daftari',
            flashReceiptId!,
            flashAmount,
            'income',
            `M-Pesa from ${flashSender}`,
          ));
        } : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink dark:text-stone-100">{t('mpesa_income')}</p>
          <p className="text-xs text-muted dark:text-stone-400">{t('bandika_sms')}</p>
        </div>
      </div>

      <div>
        <textarea
          value={smsText}
          onChange={(e) => {
            setSmsText(e.target.value);
            setParseError(false);
            setParsed(null);
          }}
          placeholder={t('bandika_sms')}
          rows={6}
          className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition resize-none"
        />
      </div>

      {parseError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-danger">{t('sms_haikupatikana')}</p>
          </div>
        </div>
      )}

      {parsed && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 shadow-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-primary-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{t('mpesa_income')}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted dark:text-stone-400 mb-1.5">{t('amount')} (KES)</label>
            <input
              type="number"
              inputMode="decimal"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-lg font-bold text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <User className="w-4 h-4 text-muted dark:text-stone-400" />
            </div>
            <div>
              <p className="text-xs text-muted dark:text-stone-400">{t('sender')}</p>
              <p className="text-sm font-medium text-ink dark:text-stone-100">{parsed.sender}</p>
            </div>
          </div>

          {parsed.code && (
            <div className="flex items-center gap-3 py-2 border-t border-border dark:border-stone-700 pt-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Hash className="w-4 h-4 text-muted dark:text-stone-400" />
              </div>
              <div>
                <p className="text-xs text-muted dark:text-stone-400">{t('mpesa_code')}</p>
                <p className="text-sm font-mono font-medium text-ink dark:text-stone-100">{parsed.code}</p>
              </div>
            </div>
          )}

          {parsed.payment_method && (
            <div className="flex items-center gap-3 py-2 border-t border-border dark:border-stone-700 pt-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted dark:text-stone-400">{t('payment_method_label')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(() => {
                    const Icon = PAYMENT_ICONS[parsed.payment_method!] || Banknote;
                    return <Icon className="w-3.5 h-3.5 text-green-600" />;
                  })()}
                  <p className="text-sm font-medium text-ink dark:text-stone-100">
                    {language === 'sw' ? PAYMENT_LABELS[parsed.payment_method]?.sw : PAYMENT_LABELS[parsed.payment_method]?.en ?? parsed.payment_method}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors"
        >
          {t('cancel')}
        </button>

        {!parsed ? (
          <button
            type="button"
            onClick={handleParse}
            disabled={!smsText.trim()}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {t('parse_sms')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !editAmount}
            className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? t('saving') : t('confirm_sms')}
          </button>
        )}
      </div>

      {parseError && (
        <button
          type="button"
          onClick={onManualEntry}
          className="w-full py-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
        >
          {t('enter_manually')}
        </button>
      )}
    </div>
  );
}
