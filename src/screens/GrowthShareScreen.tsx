import { useState } from 'react';
import {
  ChevronLeft, Sparkles, Copy, MessageCircle, Check, Twitter, Linkedin
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import {
  BRIANNA_STORY_TEMPLATES,
  type StoryTemplateId,
  type StoryParams
} from '../features/marketing/briannaContent';
import { shareViaWhatsApp } from '../lib/whatsapp';
import { useToast } from '../hooks/useToast';
import { track, EVENTS } from '../lib/analytics';

interface GrowthShareScreenProps {
  onBack: () => void;
}

export default function GrowthShareScreen({ onBack }: GrowthShareScreenProps) {
  const { language } = useTranslation();
  const business = useStore((s) => s.business);
  const transactions = useStore((s) => s.transactions);
  const completedLessonIds = useStore((s) => s.completedLessonIds || []);
  const { toast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<StoryTemplateId>('daily_milestone');
  const [copied, setCopied] = useState(false);

  const isSw = language === 'sw';
  const bizName = business?.name || 'Daftari Shop';

  // Calculate real-time stats
  const incomeTxs = transactions.filter((t) => t.type === 'income');
  const totalSales = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
  const txCount = incomeTxs.length;

  const storyParams: StoryParams = {
    businessName: bizName,
    totalSales,
    txCount,
    completedLessonsCount: completedLessonIds.length,
    lang: language as 'sw' | 'en',
  };

  const activeTemplate = BRIANNA_STORY_TEMPLATES.find((t) => t.id === selectedTemplateId) || BRIANNA_STORY_TEMPLATES[0];
  const generatedText = activeTemplate.generateText(storyParams);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast(isSw ? 'Ujumbe umenakiliwa!' : 'Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
      track(EVENTS.REFERRAL_LINK_SHARED, { channel: 'clipboard' });
    } catch {
      toast(isSw ? 'Hitilafu ya kunakili' : 'Failed to copy', 'error');
    }
  }

  function handleShareWhatsApp() {
    shareViaWhatsApp(generatedText);
    track(EVENTS.REFERRAL_LINK_SHARED, { channel: 'whatsapp' });
  }

  function handleShareTwitter() {
    const encoded = encodeURIComponent(generatedText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
    track(EVENTS.REFERRAL_LINK_SHARED, { channel: 'twitter' });
  }

  function handleShareLinkedIn() {
    const url = 'https://daftari.co.ke';
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    track(EVENTS.REFERRAL_LINK_SHARED, { channel: 'linkedin' });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950 font-sans">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4 sticky top-0 z-30">
        <div className="flex items-center h-14 gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 -ml-1"
          >
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">
              Brianna Growth Engine
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 pb-20">
        {/* Real-time Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card padding="p-3">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {isSw ? 'Mauzo' : 'Sales'}
            </p>
            <p className="text-sm font-extrabold text-emerald-600 truncate mt-0.5">
              KES {totalSales.toLocaleString('en-KE')}
            </p>
          </Card>

          <Card padding="p-3">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {isSw ? 'Miamala' : 'Sales Tx'}
            </p>
            <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate mt-0.5">
              {txCount}
            </p>
          </Card>

          <Card padding="p-3">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              {isSw ? 'Academy' : 'Courses'}
            </p>
            <p className="text-sm font-extrabold text-amber-500 truncate mt-0.5">
              {completedLessonIds.length}/4
            </p>
          </Card>
        </div>

        {/* Template Picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
            {isSw ? 'Chagua Mada ya Hadithi' : 'Select Story Angle'}
          </p>
          <div className="flex flex-col gap-2">
            {BRIANNA_STORY_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-sm'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-medium'
                  }`}
                >
                  <span className="text-xs">{tmpl.title[language as 'sw' | 'en'] || tmpl.title.sw}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Formatted Output Preview */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
            {isSw ? 'Onyesho la Ujumbe' : 'Live Content Preview'}
          </p>
          <Card padding="p-4" className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <pre className="text-xs text-stone-800 dark:text-stone-200 font-sans whitespace-pre-wrap leading-relaxed">
              {generatedText}
            </pre>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? (isSw ? 'Imenakiliwa!' : 'Copied!') : (isSw ? 'Nakili Ujumbe' : 'Copy Text')}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Status
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShareTwitter}
              className="flex-1 py-3 rounded-xl bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" />
              Twitter/X
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="flex-1 py-3 rounded-xl bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
              LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
