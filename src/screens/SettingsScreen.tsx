import { useState } from 'react';
import { ChevronRight, Building2, Package, Check, BarChart3, FileDown, Download, RefreshCw, Plus, Building, ShoppingCart, ClipboardList, Zap, HelpCircle, Share2, LogOut } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import { BUSINESS_CATEGORIES } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import { supabase } from '../lib/supabase';
import { addBusiness } from '../lib/repository';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { track, EVENTS } from '../lib/analytics';
import { transactionsToCSV, downloadCSV } from '../lib/csv';
import { exportAllData } from '../lib/backup';
import { pullFromSupabase } from '../lib/syncAll';
import { flushQueue } from '../features/sync/syncQueue';
import { generateReferralUrl, shareViaWhatsApp } from '../lib/referral';
import { useToast } from '../hooks/useToast';
import AppearanceSection from '../components/settings/AppearanceSection';

interface SettingsScreenProps {
  onSignOut: () => void;
  onNavigate?: (view: string) => void;
}

export default function SettingsScreen({ onSignOut, onNavigate }: SettingsScreenProps) {
  const { t, language } = useTranslation();
  const business = useStore((s) => s.business);
  const { canInstall, install } = usePWAInstall();
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const catKey = business?.category as BusinessCategoryKey | undefined;

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const result = await flushQueue();
      if (result.failed > 0) {
        toast(
          language === 'sw'
            ? `Imetaleta ${result.synced}, imeshindwa ${result.failed}`
            : `Synced ${result.synced}, failed ${result.failed}`,
          result.failed > 0 ? 'error' : 'success'
        );
      } else {
        toast(
          language === 'sw'
            ? `Imetaleta ${result.synced} kwa mafanikio`
            : `Synced ${result.synced} successfully`,
          'success'
        );
      }
    } catch {
      toast(
        language === 'sw' ? 'Hitilafu ya usawazishaji' : 'Sync error',
        'error'
      );
    }
    setSyncing(false);
  }

  function NavRow({ icon, label, desc, onClick }: {
    icon: React.ReactNode; label: string; desc?: string; onClick: () => void;
  }) {
    const bg = 'bg-gray-100 dark:bg-stone-800';
    return (
      <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center dark:bg-stone-800`}>
            {icon}
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-ink dark:text-stone-100">{label}</span>
            {desc && <p className="text-xs text-muted dark:text-stone-400">{desc}</p>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-4">
      {/* Business section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 mt-2 dark:text-stone-400">
          {t('business_name')}
        </p>
        <Card padding="none" overflow>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-ink dark:text-stone-100">{business?.name ?? 'Daftari'}</span>
              <p className="text-xs text-muted dark:text-stone-400">
                {catKey
                  ? (language === 'sw' ? BUSINESS_CATEGORIES[catKey]?.label.sw : BUSINESS_CATEGORIES[catKey]?.label.en)
                  : ''}
              </p>
            </div>
          </div>

          {onNavigate && (
            <>
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <NavRow
                icon={<Package className="w-4 h-4 text-green-600" />}
                label={t('my_products')}
                onClick={() => onNavigate('catalog')}
              />
            </>
          )}
        </Card>
      </div>

      {/* Manage Businesses section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {language === 'sw' ? 'Biashara Zangu' : 'My Businesses'}
        </p>
        <Card padding="none" overflow>
          {useStore.getState().businesses.map((biz) => {
            const isActive = biz.id === useStore.getState().activeBusinessId;
            return (
              <button
                key={biz.id}
                onClick={() => {
                  useStore.getState().setBusiness(biz);
                  useStore.getState().setActiveBusinessId(biz.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800 border-b border-border dark:border-stone-700 last:border-b-0"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-stone-100 dark:bg-stone-800'}`}>
                  <Building className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-muted'}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${isActive ? 'text-green-700 dark:text-green-300' : 'text-ink dark:text-stone-100'}`}>
                    {biz.name}
                  </p>
                </div>
                {isActive && <Check className="w-4 h-4 text-green-600" />}
              </button>
            );
          })}
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const localId = crypto.randomUUID();
              const now = new Date().toISOString();
              await addBusiness({
                local_id: localId,
                name: language === 'sw' ? 'Biashara Mpya' : 'New Business',
                currency: 'KES',
                user_id: user.id,
                created_at: now,
                updated_at: now,
                synced: 0,
              });
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center dark:bg-green-900">
              <Plus className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              {language === 'sw' ? 'Ongeza Biashara Mpya' : 'Add New Business'}
            </span>
          </button>
        </Card>
      </div>

      <AppearanceSection />

      {/* Inventory Management section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {language === 'sw' ? 'Usimamizi wa Bidhaa' : 'Inventory Management'}
        </p>
        <Card padding="none" overflow>
          {onNavigate && (
            <>
              <NavRow icon={<Building2 className="w-4 h-4 text-purple-600" />} label={t('suppliers')} desc={language === 'sw' ? 'Wasambazaji na wauzaji' : 'Manage your suppliers'} onClick={() => onNavigate('suppliers')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <NavRow icon={<ShoppingCart className="w-4 h-4 text-orange-600" />} label={t('purchase_orders')} desc={language === 'sw' ? 'Agiza bidhaa kutoka kwa wauzaji' : 'Order products from suppliers'} onClick={() => onNavigate('purchase-orders')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <NavRow icon={<ClipboardList className="w-4 h-4 text-amber-600" />} label={t('stock_adjustments')} desc={language === 'sw' ? 'Rekebisha hesabu za bidhaa' : 'Adjust product stock levels'} onClick={() => onNavigate('stock-adjustments')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <NavRow icon={<Zap className="w-4 h-4 text-blue-600" />} label={t('batch_entry')} desc={language === 'sw' ? 'Rekodi miamala mingi mfululizo' : 'Record multiple transactions quickly'} onClick={() => onNavigate('batch-entry')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <NavRow icon={<Zap className="w-4 h-4 text-cyan-600" />} label={t('pos') || 'POS Mode'} desc={language === 'sw' ? 'Sehemu ya kuuza bila taabu' : 'Touch-friendly point of sale'} onClick={() => onNavigate('pos')} />
            </>
          )}
        </Card>
      </div>

      {/* Data & Reports section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {language === 'sw' ? 'Data & Ripoti' : 'Data & Reports'}
        </p>
        <Card padding="none" overflow>
          {onNavigate && (
            <>
              <NavRow icon={<BarChart3 className="w-4 h-4 text-green-600" />} label={language === 'sw' ? 'Ripoti ya Mwezi' : 'Monthly Report'} desc={language === 'sw' ? 'Faida, gharama, na kulinganisha' : 'Profit, expenses & comparison'} onClick={() => onNavigate('monthly-report')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <NavRow icon={<Package className="w-4 h-4 text-teal-600" />} label={language === 'sw' ? 'Faida kwa Bidhaa' : 'Product Profitability'} desc={language === 'sw' ? 'Angalia faida kwa kila bidhaa' : 'View margin per product'} onClick={() => onNavigate('product-profitability')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
            </>
          )}
          <NavRow icon={<FileDown className="w-4 h-4 text-blue-600" />} label={language === 'sw' ? 'Pakua CSV' : 'Export CSV'} desc={language === 'sw' ? 'Pakua miamala yote kwa Excel' : 'Download all transactions for Excel'} onClick={() => { const csv = transactionsToCSV(useStore.getState().transactions); const filename = `daftari_${new Date().toISOString().slice(0, 10)}.csv`; downloadCSV(csv, filename); }} />
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          <NavRow icon={<Download className="w-4 h-4 text-teal-600" />} label={language === 'sw' ? 'Hifadhi Backup' : 'Export Backup'} desc={language === 'sw' ? 'Pakua data yote kwa JSON' : 'Download all data as JSON'} onClick={exportAllData} />
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          <NavRow icon={<RefreshCw className="w-4 h-4 text-purple-600" />} label={language === 'sw' ? 'Rejesha kutoka Wavuti' : 'Restore from Cloud'} desc={language === 'sw' ? 'Pakua data yako kutoka Supabase' : 'Pull your data from backup'} onClick={async () => { const { restored, errors } = await pullFromSupabase(); if (errors.length > 0) { alert(errors.join('\n')); } else { alert(restored.join('\n') || (language === 'sw' ? 'Hakuna data kupatikana' : 'No data found')); window.location.reload(); } }} />
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            aria-label={language === 'sw' ? 'Sawazisha sasa' : 'Sync now'}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800 disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${syncing ? 'bg-amber-50 dark:bg-amber-900' : 'bg-cyan-50 dark:bg-cyan-900'}`}>
                <RefreshCw className={`w-4 h-4 ${syncing ? 'text-amber-600 animate-spin' : 'text-cyan-600'}`} />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-ink dark:text-stone-100">
                  {syncing ? (language === 'sw' ? 'Inasawazisha...' : 'Syncing...') : (language === 'sw' ? 'Sawazisha Sasa' : 'Sync Now')}
                </span>
                <p className="text-xs text-muted dark:text-stone-400">
                  {language === 'sw' ? 'Sawazisha data na wavuti' : 'Sync pending data to cloud'}
                </p>
              </div>
            </div>
            {syncing && <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />}
          </button>
        </Card>
      </div>

      {/* PWA Install section */}
      {canInstall && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
            {t('install_daftari')}
          </p>
          <Card padding="none" overflow>
            <button onClick={install} className="w-full flex items-center justify-between px-4 py-4 hover:bg-blue-50 transition-colors dark:hover:bg-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('install_daftari')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{t('open_without_browser')}</p>
                </div>
              </div>
              <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{t('install')}</div>
            </button>
          </Card>
        </div>
      )}

      {/* Account section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">Account</p>
        <Card padding="none" overflow>
          {onNavigate ? (
            <NavRow icon={<Building2 className="w-4 h-4 text-muted dark:text-stone-400" />} label={t('business_profile')} onClick={() => onNavigate('profile')} />
          ) : (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-stone-800">
                <Building2 className="w-4 h-4 text-muted dark:text-stone-400" />
              </div>
              <span className="text-sm font-medium text-ink dark:text-stone-100">{t('business_profile')}</span>
            </div>
          )}
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          {onNavigate && (
            <>
              <NavRow icon={<HelpCircle className="w-4 h-4 text-blue-600" />} label={language === 'sw' ? 'Msaada' : 'Help'} onClick={() => onNavigate('help')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
            </>
          )}
          {business && (
            <>
              <NavRow icon={<Share2 className="w-4 h-4 text-amber-600" />} label={language === 'sw' ? 'Mwambie Rafiki' : 'Tell a Friend'} desc={language === 'sw' ? 'Saidia mfanyabiashara mwenzako' : 'Help a fellow business owner'} onClick={() => { const url = generateReferralUrl(business.name, business.category); shareViaWhatsApp(url, language); }} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
            </>
          )}
          {import.meta.env.VITE_ADMIN_USER_ID && (
            <>
              <NavRow icon={<BarChart3 className="w-4 h-4 text-purple-600" />} label="Admin" onClick={() => onNavigate?.('admin')} />
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
            </>
          )}
          <button onClick={async () => { track(EVENTS.SIGNOUT); await supabase.auth.signOut(); onSignOut(); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors dark:hover:bg-red-950">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center dark:bg-red-900">
              <LogOut className="w-4 h-4 text-danger" />
            </div>
            <span className="text-sm font-medium text-danger">{t('sign_out')}</span>
          </button>
        </Card>
      </div>

      <p className="text-center text-xs text-muted pb-4 dark:text-stone-400">{t('made_in_kenya')}</p>
    </div>
  );
}