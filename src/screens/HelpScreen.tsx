import { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface HelpScreenProps {
  onBack: () => void;
}

const FAQS: Array<{ sw: string; en: string; swA: string; enA: string }> = [
  {
    sw: 'Ninawezaje kurekodi mauzo?',
    en: 'How do I record a sale?',
    swA: 'Bonyeza kitufe cha "+" kwenye dashibodi au nenda kwenye sehemu ya POS kwa ajili ya mauzo ya haraka. Ingiza kiasi, maelezo, na kategoria kisha bonyeza "Hifadhi".',
    enA: 'Tap the "+" button on the dashboard or use POS mode for quick sales. Enter the amount, description, and category then tap "Save".',
  },
  {
    sw: 'Je, POS inafanya kazi vipi?',
    en: 'How does the POS mode work?',
    swA: 'POS inakuwezesha kuuza bidhaa kwa kugusa tu. Chagua bidhaa kutoka kwenye gridi, kisha ongeza kwenye troli. Unaweza kuchanganua barcode kwa kamera. Mwisho, bonyeza "Malipo" kukamilisha.',
    enA: 'POS lets you sell products by tapping. Select products from the grid to add to cart. You can scan barcodes with your camera. Tap "Checkout" to complete.',
  },
  {
    sw: 'Data yangu inahifadhiwa wapi?',
    en: 'Where is my data stored?',
    swA: 'Data yako huhifadhiwa kwenye kifaa chako (IndexedDB) na pia kwenye wavuti (Supabase) ukishaingia. Unaweza kurejesha data kutoka wavuti wakati wowote kwenye Mipangilio.',
    enA: 'Your data is stored on your device (IndexedDB) and in the cloud (Supabase) when signed in. You can restore from cloud anytime in Settings.',
  },
  {
    sw: 'Je, ninaweza kutumia Daftari nje ya mtandao?',
    en: 'Can I use Daftari offline?',
    swA: 'Ndiyo. Daftari inafanya kazi nje ya mtandao. Data yako itasawazishwa mtandaoni mtandao unaporudi.',
    enA: 'Yes. Daftari works offline. Your data will sync to the cloud when you\'re back online.',
  },
  {
    sw: 'Pointi za uaminifu zinafanya kazi vipi?',
    en: 'How do loyalty points work?',
    swA: 'Wateja hupata pointi 1 kwa kila KES 100 wanazotumia. Pointi 10 zinaweza kutumiwa kupata punguzo la KES 1 kwenye POS.',
    enA: 'Customers earn 1 point for every KES 100 spent. 10 points can be redeemed for KES 1 discount at POS checkout.',
  },
  {
    sw: 'Ninawezaje kuchapisha risiti?',
    en: 'How do I print a receipt?',
    swA: 'Baada ya kurekodi mauzo, utaona vitufe vya "Chapisha Risiti" (kwa printa ya kawaida) na "Chapisha Thermal" (kwa printa ya Bluetooth). Bonyeza mojawapo kuchapisha.',
    enA: 'After recording a sale, you\'ll see "Print Receipt" (for a standard printer) and "Print Thermal" (for Bluetooth thermal printer) buttons. Tap one to print.',
  },
];

export default function HelpScreen({ onBack }: HelpScreenProps) {
  const { language } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1" aria-label={language === 'sw' ? 'Rudi' : 'Back'}>
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <span className="font-bold text-ink dark:text-stone-100 text-base">{language === 'sw' ? 'Msaada' : 'Help'}</span>
        </div>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted dark:text-stone-400 mb-1">{language === 'sw' ? 'Maswali yanayoulizwa mara kwa mara' : 'Frequently asked questions'}</p>
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              aria-expanded={openIndex === i}
            >
              <span className="text-sm font-medium text-ink dark:text-stone-100">{language === 'sw' ? faq.sw : faq.en}</span>
              {openIndex === i ? <ChevronUp className="w-4 h-4 text-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" />}
            </button>
            {openIndex === i && (
              <div className="px-4 pb-3.5">
                <p className="text-sm text-muted dark:text-stone-400 leading-relaxed">{language === 'sw' ? faq.swA : faq.enA}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
