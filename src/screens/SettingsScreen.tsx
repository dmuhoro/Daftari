import { useState, useEffect } from 'react';
import { LogOut, ChevronRight, User, Building2, Download, Sun, Moon, Monitor, Check, Calendar, BarChart3, FileDown, Plus, RefreshCw, Building, Package, ShoppingCart, ClipboardList, Zap, HelpCircle, Share2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import { BUSINESS_CATEGORIES, categoryEmoji } from '../lib/businessCategories';
import type { BusinessCategoryKey } from '../lib/businessCategories';
import { supabase } from '../lib/supabase';
import { getBusiness, updateBusiness as repoUpdateBusiness, addBusiness } from '../lib/repository';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { track, EVENTS } from '../lib/analytics';
import { transactionsToCSV, downloadCSV } from '../lib/csv';
import { exportAllData } from '../lib/backup';
import { pullFromSupabase } from '../lib/syncAll';
import { flushQueue } from '../features/sync/syncQueue';
import { generateReferralUrl, shareViaWhatsApp } from '../lib/referral';
import { useToast } from '../hooks/useToast';

interface SettingsScreenProps {
  onSignOut: () => void;
  onNavigate?: (view: string) => void;
}

export default function SettingsScreen({ onSignOut, onNavigate }: SettingsScreenProps) {
  const { t, language } = useTranslation();
  const languageStore = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);
  const { canInstall, install } = usePWAInstall();

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [pickCategory, setPickCategory] = useState<BusinessCategoryKey | null>(null);
  const [pickSubcategory, setPickSubcategory] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [showCategoryConfirm, setShowCategoryConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [userLastSignIn, setUserLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserCreatedAt(user.created_at ?? null);
        setUserLastSignIn(user.last_sign_in_at ?? null);
      }
    });
  }, []);

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date >= today) return t('leo');
    if (date >= yesterday) return t('jana');
    return date.toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const catKey = business?.category as BusinessCategoryKey | undefined;
  const subKey = business?.subcategory;

  const currentCategoryLabel = catKey
    ? language === 'sw'
      ? BUSINESS_CATEGORIES[catKey]?.label.sw
      : BUSINESS_CATEGORIES[catKey]?.label.en
    : null;

  const currentSubcategoryLabel = catKey && subKey
    ? language === 'sw'
      ? (BUSINESS_CATEGORIES[catKey]?.subcategories as Record<string, { sw: string; en: string }>)[subKey]?.sw
      : (BUSINESS_CATEGORIES[catKey]?.subcategories as Record<string, { sw: string; en: string }>)[subKey]?.en
    : null;

  async function handleSignOut() {
    track(EVENTS.SIGNOUT)
    await supabase.auth.signOut();
    onSignOut();
  }

  async function handleCategoryChange() {
    if (!pickCategory || !pickSubcategory || !business) return;
    setSavingCategory(true);
    updateBusiness({
      category: pickCategory,
      subcategory: pickSubcategory,
      products: [],
    });
    try {
      const bizResult = await getBusiness();
      if (bizResult.ok && bizResult.value?.id) {
        await repoUpdateBusiness(bizResult.value.id, {
          category: pickCategory,
          subcategory: pickSubcategory,
          products: '[]',
        });
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('daftari_businesses').upsert({
          owner_id: user.id,
          category: pickCategory,
          subcategory: pickSubcategory,
          products: [],
        }, { onConflict: 'owner_id' });
      }
    } catch (e) { console.warn('Category change background sync failed', e); }
    setSavingCategory(false);
    setShowCategoryPicker(false);
    setPickCategory(null);
    setPickSubcategory(null);
  }

  const { toast } = useToast();

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

  const categoryEntries = Object.entries(BUSINESS_CATEGORIES) as [BusinessCategoryKey, typeof BUSINESS_CATEGORIES[BusinessCategoryKey]][];

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-4">
      {/* Business section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 mt-2">
          {t('business_name')}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center dark:bg-primary-900">
              <Building2 className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-ink dark:text-stone-100">{business?.name ?? 'Daftari'}</span>
              {currentCategoryLabel && (
                <p className="text-xs text-muted dark:text-stone-400">
                  {currentCategoryLabel}{currentSubcategoryLabel ? ` / ${currentSubcategoryLabel}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Business category picker */}
          {!showCategoryPicker ? (
            <button
              onClick={() => setShowCategoryPicker(true)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800 border-t border-border dark:border-stone-700"
            >
              <span className="text-sm text-muted dark:text-stone-400">{t('change_category')}</span>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          ) : (
            <div className="border-t border-border dark:border-stone-700 p-4">
              {!pickCategory ? (
                <div>
                  <p className="text-sm font-medium text-ink dark:text-stone-100 mb-3">{t('what_business')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryEntries.map(([key, cat]) => {
                      const emoji = categoryEmoji[key];
                      return (
                        <button
                          key={key}
                          onClick={() => { setPickCategory(key); setPickSubcategory(null); }}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-border dark:border-stone-700 hover:border-green-300 transition-colors"
                        >
                          <span className="text-xl">{emoji}</span>
                          <span className="text-xs font-medium text-ink dark:text-stone-100 text-center">
                            {language === 'sw' ? cat.label.sw : cat.label.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShowCategoryPicker(false)}
                    className="mt-3 text-xs text-muted dark:text-stone-400 underline"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-ink dark:text-stone-100 mb-3">{t('choose_subcategory')}</p>
                  <div className="flex flex-col gap-1">
                    {Object.entries(BUSINESS_CATEGORIES[pickCategory].subcategories).map(([key, sub]) => (
                      <button
                        key={key}
                        onClick={() => setPickSubcategory(key)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                          pickSubcategory === key
                            ? 'bg-green-50 border-green-600 dark:bg-green-900 dark:border-green-500'
                            : 'bg-white dark:bg-stone-900 border-border dark:border-stone-700'
                        }`}
                      >
                        <span className={`text-sm font-medium ${pickSubcategory === key ? 'text-green-700 dark:text-green-300' : 'text-ink dark:text-stone-100'}`}>
                          {language === 'sw' ? sub.sw : sub.en}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setPickCategory(null); }}
                      className="flex-1 py-2.5 rounded-xl border border-border dark:border-stone-700 text-xs font-medium text-muted dark:text-stone-400"
                    >
                      {t('continue')}
                    </button>
                    {pickSubcategory && (
                      <button
                        onClick={() => {
                          if ((business?.products ?? []).length > 0) {
                            setShowCategoryConfirm(true);
                          } else {
                            handleCategoryChange();
                          }
                        }}
                        disabled={savingCategory}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {savingCategory ? t('saving') : t('save')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {onNavigate && (
            <>
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center dark:bg-green-900">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('my_products')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Manage Businesses section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {language === 'sw' ? 'Biashara Zangu' : 'My Businesses'}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          {/* Business switcher */}
          {(() => {
            const businesses = useStore.getState().businesses;
            const activeId = useStore.getState().activeBusinessId;
            return businesses.map((biz) => {
              const isActive = biz.id === activeId;
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
            });
          })()}

          {/* Add Business */}
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
        </div>
      </div>

      {/* Appearance section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {t('appearance_settings')}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-4 dark:bg-stone-900 dark:border-stone-700">
          <div>
            <p className="text-xs font-medium text-muted mb-2 dark:text-stone-400">{t('language')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage('sw')}
                className={`flex-1 py-3 rounded-xl border-2 text-center text-sm font-semibold transition-colors ${
                  languageStore === 'sw'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                }`}
              >
                🇰🇪 Kiswahili
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-3 rounded-xl border-2 text-center text-sm font-semibold transition-colors ${
                  languageStore === 'en'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-2 dark:text-stone-400">{t('appearance')}</p>
            <div className="flex gap-3">
              {(['light', 'dark', 'system'] as const).map((tm) => {
                const isActive = theme === tm;
                const Icon = tm === 'light' ? Sun : tm === 'dark' ? Moon : Monitor;
                return (
                  <button
                    key={tm}
                    onClick={() => setTheme(tm)}
                    className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tm === 'light' ? t('theme_light') : tm === 'dark' ? t('theme_dark') : t('theme_system')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Management section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {language === 'sw' ? 'Usimamizi wa Bidhaa' : 'Inventory Management'}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          {onNavigate && (
            <button onClick={() => onNavigate('suppliers')} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center dark:bg-purple-900">
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('suppliers')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Wasambazaji na wauzaji' : 'Manage your suppliers'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          {onNavigate && (
            <button onClick={() => onNavigate('purchase-orders')} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center dark:bg-orange-900">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('purchase_orders')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Agiza bidhaa kutoka kwa wauzaji' : 'Order products from suppliers'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          {onNavigate && (
            <button onClick={() => onNavigate('stock-adjustments')} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center dark:bg-amber-900">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('stock_adjustments')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Rekebisha hesabu za bidhaa' : 'Adjust product stock levels'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          {onNavigate && (
            <button onClick={() => onNavigate('batch-entry')} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('batch_entry')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Rekodi miamala mingi mfululizo' : 'Record multiple transactions quickly'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}
          <div className="h-px bg-border mx-4 dark:bg-stone-700" />
          {onNavigate && (
            <button onClick={() => onNavigate('pos')} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center dark:bg-cyan-900">
                  <Zap className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('pos') || 'POS Mode'}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{language === 'sw' ? 'Sehemu ya kuuza bila taabu' : 'Touch-friendly point of sale'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}
        </div>
      </div>

      {/* Data & Reports section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          {language === 'sw' ? 'Data & Ripoti' : 'Data & Reports'}
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          {onNavigate && (
            <button
              onClick={() => onNavigate('monthly-report')}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center dark:bg-green-900">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">
                    {language === 'sw' ? 'Ripoti ya Mwezi' : 'Monthly Report'}
                  </span>
                  <p className="text-xs text-muted dark:text-stone-400">
                    {language === 'sw' ? 'Faida, gharama, na kulinganisha' : 'Profit, expenses & comparison'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          {onNavigate && (
            <button
              onClick={() => onNavigate('product-profitability')}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center dark:bg-teal-900">
                  <Package className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">
                    {language === 'sw' ? 'Faida kwa Bidhaa' : 'Product Profitability'}
                  </span>
                  <p className="text-xs text-muted dark:text-stone-400">
                    {language === 'sw' ? 'Angalia faida kwa kila bidhaa' : 'View margin per product'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          <button
            onClick={() => {
              const csv = transactionsToCSV(useStore.getState().transactions);
              const filename = `daftari_${new Date().toISOString().slice(0, 10)}.csv`;
              downloadCSV(csv, filename);
            }}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
                <FileDown className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-ink dark:text-stone-100">
                  {language === 'sw' ? 'Pakua CSV' : 'Export CSV'}
                </span>
                <p className="text-xs text-muted dark:text-stone-400">
                  {language === 'sw' ? 'Pakua miamala yote kwa Excel' : 'Download all transactions for Excel'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
          </button>

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          <button
            onClick={exportAllData}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center dark:bg-teal-900">
                <Download className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-ink dark:text-stone-100">
                  {language === 'sw' ? 'Hifadhi Backup' : 'Export Backup'}
                </span>
                <p className="text-xs text-muted dark:text-stone-400">
                  {language === 'sw' ? 'Pakua data yote kwa JSON' : 'Download all data as JSON'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
          </button>

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          <button
            onClick={async () => {
              const { restored, errors } = await pullFromSupabase();
              if (errors.length > 0) {
                alert(errors.join('\n'));
              } else {
                alert(restored.join('\n') || (language === 'sw' ? 'Hakuna data kupatikana' : 'No data found'));
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center dark:bg-purple-900">
                <RefreshCw className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-ink dark:text-stone-100">
                  {language === 'sw' ? 'Rejesha kutoka Wavuti' : 'Restore from Cloud'}
                </span>
                <p className="text-xs text-muted dark:text-stone-400">
                  {language === 'sw' ? 'Pakua data yako kutoka Supabase' : 'Pull your data from backup'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
          </button>

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
                  {syncing
                    ? (language === 'sw' ? 'Inasawazisha...' : 'Syncing...')
                    : (language === 'sw' ? 'Sawazisha Sasa' : 'Sync Now')}
                </span>
                <p className="text-xs text-muted dark:text-stone-400">
                  {language === 'sw' ? 'Sawazisha data na wavuti' : 'Sync pending data to cloud'}
                </p>
              </div>
            </div>
            {syncing && <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />}
          </button>
        </div>
      </div>

      {/* PWA Install section */}
      {canInstall && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
            {t('install_daftari')}
          </p>
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
            <button
              onClick={install}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-blue-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">{t('install_daftari')}</span>
                  <p className="text-xs text-muted dark:text-stone-400">{t('open_without_browser')}</p>
                </div>
              </div>
              <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                {t('install')}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Account section */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2 dark:text-stone-400">
          Account
        </p>
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden dark:bg-stone-900 dark:border-stone-700">
          {/* User profile card */}
          {userEmail && (
            <>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted dark:text-stone-400 uppercase tracking-widest mb-2">
                  {t('user_profile')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center dark:bg-primary-900">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-stone-100 truncate">{userEmail}</p>
                    {userCreatedAt && (
                      <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {t('account_created')}: {formatDate(userCreatedAt)}
                      </p>
                    )}
                    {userLastSignIn && (
                      <p className="text-xs text-muted dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {t('last_sign_in')}: {formatDate(userLastSignIn)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
            </>
          )}

          {onNavigate ? (
            <button
              onClick={() => onNavigate('profile')}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-stone-800">
                  <Building2 className="w-4 h-4 text-muted dark:text-stone-400" />
                </div>
                <span className="text-sm font-medium text-ink dark:text-stone-100">{t('business_profile')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center dark:bg-stone-800">
                <Building2 className="w-4 h-4 text-muted dark:text-stone-400" />
              </div>
              <span className="text-sm font-medium text-ink dark:text-stone-100">{t('business_profile')}</span>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-muted dark:text-stone-400">
              {t('signed_in_as') || 'Signed in as'} <span className="font-medium text-ink dark:text-stone-100">{userEmail || '—'}</span>
            </span>
          </div>

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          {onNavigate && (
            <button
              onClick={() => onNavigate('help')}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center dark:bg-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-ink dark:text-stone-100">{language === 'sw' ? 'Msaada' : 'Help'}</span>
            </button>
          )}

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          {business && (
            <button
              onClick={() => {
                const url = generateReferralUrl(business.name, business.category);
                shareViaWhatsApp(url, language);
              }}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-amber-50 transition-colors dark:hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center dark:bg-amber-900">
                  <Share2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-ink dark:text-stone-100">
                    {language === 'sw' ? 'Mwambie Rafiki' : 'Tell a Friend'}
                  </span>
                  <p className="text-xs text-muted dark:text-stone-400">
                    {language === 'sw' ? 'Saidia mfanyabiashara mwenzako' : 'Help a fellow business owner'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted dark:text-stone-400" />
            </button>
          )}

          {import.meta.env.VITE_ADMIN_USER_ID && (
            <>
              <div className="h-px bg-border mx-4 dark:bg-stone-700" />
              <button onClick={() => onNavigate?.('admin')} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-stone-50 transition-colors dark:hover:bg-stone-800">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center dark:bg-purple-900">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-ink dark:text-stone-100">Admin</span>
              </button>
            </>
          )}

          <div className="h-px bg-border mx-4 dark:bg-stone-700" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors dark:hover:bg-red-950"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center dark:bg-red-900">
              <LogOut className="w-4 h-4 text-danger" />
            </div>
            <span className="text-sm font-medium text-danger">{t('sign_out')}</span>
          </button>
        </div>
      </div>

      {/* Category change confirmation */}
      {showCategoryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowCategoryConfirm(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-center text-ink dark:text-stone-100 mb-2">{language === 'sw' ? 'Badilisha aina ya biashara?' : 'Change business category?'}</p>
            <p className="text-sm text-muted dark:text-stone-400 text-center mb-6">
              {language === 'sw'
                ? `Hii itafuta bidhaa zako zote (${(business?.products ?? []).length}) na kuingiza template za aina mpya.`
                : `This will clear all your products (${(business?.products ?? []).length}) and load templates for the new category.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCategoryConfirm(false)} className="flex-1 py-3 rounded-xl border border-border dark:border-stone-700 text-sm font-medium text-muted dark:text-stone-400">{t('cancel')}</button>
              <button onClick={() => { setShowCategoryConfirm(false); handleCategoryChange(); }} className="flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold">{language === 'sw' ? 'Badilisha' : 'Change'}</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted pb-4 dark:text-stone-400">{t('made_in_kenya')}</p>
    </div>
  );
}
