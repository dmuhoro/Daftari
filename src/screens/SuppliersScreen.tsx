import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Plus, Trash2, Building2, Phone, Mail, MapPin, FileText, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import TextField from '../components/ui/TextField';
import type { Supplier } from '../lib/db';
import { getSuppliersByBusinessId, saveSupplier, deleteSupplierByLocalId } from '../lib/repository';

interface SuppliersScreenProps {
  onBack: () => void;
}

export default function SuppliersScreen({ onBack }: SuppliersScreenProps) {
  const { t } = useTranslation();
  const activeBusinessId = useStore((s) => s.activeBusinessId);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    const result = await getSuppliersByBusinessId(activeBusinessId ?? '');
    if (result.ok) setSuppliers(result.value);
  }, [activeBusinessId]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  async function handleSave() {
    if (!name.trim() || !activeBusinessId) return;
    const nameDup = suppliers.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
    if (nameDup && !confirm(`A supplier named '${name.trim()}' already exists. Add anyway?`)) {
      return;
    }
    const phoneVal = phone.trim();
    if (phoneVal) {
      const phoneDup = suppliers.find(s => s.phone === phoneVal);
      if (phoneDup && !confirm(`A supplier with phone '${phoneVal}' already exists. Add anyway?`)) {
        return;
      }
    }
    const now = new Date().toISOString();
    await saveSupplier({
      local_id: crypto.randomUUID(),
      business_id: activeBusinessId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      created_at: now,
      updated_at: now,
      synced: 0,
    });
    setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes('');
    setShowForm(false);
    await loadSuppliers();
  }

  async function handleDelete(localId: string) {
    await deleteSupplierByLocalId(localId);
    setDeleteId(null);
    await loadSuppliers();
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">{t('suppliers')}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {suppliers.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-muted dark:text-stone-400" />
            </div>
            <p className="text-sm text-muted dark:text-stone-400">{t('hakuna_wasambazaji')}</p>
            <p className="text-xs text-muted dark:text-stone-400">{t('wasambazaji_wataonekana')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {suppliers.map((s) => (
              <Card key={s.local_id} variant="subtle" padding="none" className="px-4 py-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-stone-100">{s.name}</p>
                    {s.phone && (
                      <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {s.phone}
                      </p>
                    )}
                    {s.email && (
                      <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {s.email}
                      </p>
                    )}
                    {s.address && (
                      <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {s.address}
                      </p>
                    )}
                    {s.notes && (
                      <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <FileText className="w-3 h-3" /> {s.notes}
                      </p>
                    )}
                  </div>
                  {deleteId === s.local_id ? (
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => setDeleteId(null)} className="text-xs text-muted dark:text-stone-400 px-2 py-1">Cancel</button>
                      <button onClick={() => handleDelete(s.local_id)} className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded-lg">{t('delete_product')}</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(s.local_id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-muted dark:text-stone-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <Card variant="subtle" padding="p-4" className="mt-4">
            <div className="flex flex-col gap-3">
              <TextField type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('supplier_name')} autoFocus />
              <TextField type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('supplier_phone')} pattern="[0-9+\-\s()]+" title="Enter a valid phone number" />
              <TextField type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('supplier_email')} />
              <TextField type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('supplier_address')} />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('supplier_notes')} rows={2} maxLength={200} className="w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 px-4 py-3 text-sm text-ink dark:text-stone-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none" />
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes(''); }} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('cancel')}</button>
                <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> {t('save')}</button>
              </div>
            </div>
          </Card>
        )}

        {!showForm && (
          <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400 hover:text-purple-600 hover:border-purple-300 transition-colors mt-4 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> {t('add_supplier')}
          </button>
        )}
      </div>
    </div>
  );
}