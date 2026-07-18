import {
  UtensilsCrossed, ShoppingBag, Hammer, Sprout, Scissors, Bike, Briefcase,
  X, Check, Banknote, Smartphone, Wallet, Store, Building2, Wifi,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface LandingScreenProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

const CATEGORIES = [
  { icon: UtensilsCrossed, sw: 'Chakula & Vinywaji', en: 'Food & Beverages' },
  { icon: ShoppingBag, sw: 'Bidhaa & Rejareja', en: 'Retail & Trade' },
  { icon: Hammer, sw: 'Jua Kali & Ufundi', en: 'Jua Kali & Artisan' },
  { icon: Sprout, sw: 'Kilimo & Mifugo', en: 'Agriculture & Livestock' },
  { icon: Scissors, sw: 'Huduma', en: 'Personal Services' },
  { icon: Bike, sw: 'Usafiri', en: 'Transport' },
  { icon: Briefcase, sw: 'Wakala & Kitaalamu', en: 'Agents & Professional' },
];

const PAYMENTS = [
  { icon: Banknote, sw: 'Pesa Taslimu', en: 'Cash' },
  { icon: Smartphone, sw: 'M-Pesa', en: 'M-Pesa' },
  { icon: Wallet, sw: 'Pochi', en: 'Pochi' },
  { icon: Store, sw: 'Till', en: 'Till' },
  { icon: Building2, sw: 'Paybill', en: 'Paybill' },
  { icon: Wifi, sw: 'Airtel', en: 'Airtel' },
];

export default function LandingScreen({ onSignUp, onSignIn }: LandingScreenProps) {
  const { t, language } = useTranslation();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* HERO */}
      <div className="bg-stone-900 text-white py-16 px-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center mb-4">
            <span className="text-white text-3xl font-black">D</span>
          </div>
          <h1 className="text-5xl font-black text-green-400 mb-3">Daftari</h1>
          <p className="text-lg text-stone-300 mb-8">
            {language === 'sw' ? 'Biashara yako, mfukoni mwako.' : 'Your business, in your pocket.'}
          </p>
          <button
            onClick={onSignUp}
            className="w-full max-w-xs py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-stone-900 text-lg font-bold transition-colors"
          >
            {t('start_free')}
          </button>
          <button
            onClick={onSignIn}
            className="mt-4 text-stone-400 text-sm underline hover:text-stone-300 transition-colors"
          >
            {t('already_have_account')}
          </button>
        </div>
      </div>

      {/* WHO IT'S FOR */}
      <div className="bg-white py-10 px-6">
        <h2 className="text-xl font-bold text-ink text-center mb-1">{t('built_for_every_business')}</h2>
        <p className="text-sm text-muted text-center mb-5">{t('from_veggie_to_carpenter')}</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.en} className="flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-2 whitespace-nowrap flex-shrink-0">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{language === 'sw' ? cat.sw : cat.en}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROBLEM */}
      <div className="bg-stone-50 py-10 px-6">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
          {[
            language === 'sw' ? "Hujui faida yako ya leo" : "You don't know today's profit",
            language === 'sw' ? 'Daftari ya karatasi inachukua muda' : 'Paper records are exhausting',
            language === 'sw' ? 'Fuliza inakula pesa bila kujua' : 'Fuliza eats profit silently',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-ink">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SOLUTION */}
      <div className="bg-green-600 text-white py-10 px-6">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
          {[
            language === 'sw' ? 'Rekodi mauzo kwa sekunde 5' : 'Record a sale in 5 seconds',
            language === 'sw' ? 'Inafanya kazi bila mtandao' : 'Works without internet',
            language === 'sw' ? 'Ukweli wa faida yako kila siku' : 'Your real profit, every day',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PAYMENT METHODS */}
      <div className="bg-white py-10 px-6">
        <h2 className="text-xl font-bold text-ink text-center mb-6">
          {language === 'sw' ? 'Inakubali malipo yote' : 'Accepts all payments'}
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {PAYMENTS.map((pm) => {
            const Icon = pm.icon;
            return (
              <div key={pm.en} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-muted" />
                </div>
                <span className="text-xs text-muted text-center">{language === 'sw' ? pm.sw : pm.en}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUOTE */}
      <div className="bg-stone-50 py-10 px-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 max-w-sm mx-auto">
          <p className="text-sm text-ink italic">
            "The manual process of going through transaction records to track sales profits and the money to keep the business running is tiring."
          </p>
          <p className="text-xs text-muted mt-3 font-medium">— Chapati vendor, Nairobi</p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="bg-green-600 py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-6">{t('try_free')}</h2>
        <button
          onClick={onSignUp}
          className="w-full max-w-xs py-4 rounded-2xl bg-white text-green-700 text-lg font-bold transition-colors hover:bg-stone-100"
        >
          {t('start_free')}
        </button>
        <button
          onClick={onSignIn}
          className="block mx-auto mt-4 text-green-200 text-sm underline hover:text-white transition-colors"
        >
          {t('ready_account')}
        </button>
      </div>
    </div>
  );
}
