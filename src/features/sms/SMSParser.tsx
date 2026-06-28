import { useState } from 'react';
import { MessageSquare, CheckCircle, AlertCircle, User, Hash } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../lib/store';
import { parseMpesaSMS } from './parseMpesa';

interface SMSParserProps {
  onSave: () => void;
  onCancel: () => void;
  onManualEntry: () => void;
}

export default function SMSParser({ onSave, onCancel, onManualEntry }: SMSParserProps) {
  const { t } = useTranslation();
  const addTransaction = useStore((s) => s.addTransaction);

  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseMpesaSMS>>(null);
  const [editAmount, setEditAmount] = useState('');
  const [parseError, setParseError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  function handleParse() {
    const result = parseMpesaSMS(smsText);
    if (result) {
      setParsed(result);
      setEditAmount(String(result.amount));
      setParseError(false);
    } else {
      setParsed(null);
      setParseError(true);
    }
  }

  async function handleConfirm() {
    if (!parsed) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSaving(true);
    await addTransaction({
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
    });
    setSaving(false);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onSave();
    }, 800);
  }

  if (flash) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary-600" />
        </div>
        <p className="text-base font-semibold text-ink">{t('recorded')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{t('mpesa_income')}</p>
          <p className="text-xs text-muted">{t('bandika_sms')}</p>
        </div>
      </div>

      {/* SMS Textarea */}
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
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-danger">{t('sms_haikupatikana')}</p>
          </div>
        </div>
      )}

      {/* Parsed Result Card */}
      {parsed && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-primary-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{t('mpesa_income')}</span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t('amount')} (KES)</label>
            <input
              type="number"
              inputMode="decimal"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
            />
          </div>

          {/* Sender */}
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-muted" />
            </div>
            <div>
              <p className="text-xs text-muted">{t('sender')}</p>
              <p className="text-sm font-medium text-ink">{parsed.sender}</p>
            </div>
          </div>

          {/* M-Pesa Code */}
          {parsed.code && (
            <div className="flex items-center gap-3 py-2 border-t border-border pt-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Hash className="w-4 h-4 text-muted" />
              </div>
              <div>
                <p className="text-xs text-muted">{t('mpesa_code')}</p>
                <p className="text-sm font-mono font-medium text-ink">{parsed.code}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:bg-gray-50 transition-colors"
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

      {/* Manual entry link */}
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
