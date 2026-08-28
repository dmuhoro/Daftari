export interface StoryParams {
  businessName: string;
  totalSales: number;
  txCount: number;
  completedLessonsCount: number;
  categoryName?: string;
  lang?: 'sw' | 'en';
}

export type StoryTemplateId = 'daily_milestone' | 'debt_victory' | 'academy_hero' | 'founder_build_in_public';

export interface StoryTemplate {
  id: StoryTemplateId;
  title: { sw: string; en: string };
  generateText: (params: StoryParams) => string;
}

export const BRIANNA_STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'daily_milestone',
    title: {
      sw: 'Hatua ya Siku: Mauzo ya Leo',
      en: 'Daily Milestone: Today’s Sales',
    },
    generateText: ({ businessName, totalSales, txCount, lang = 'sw' }: StoryParams) => {
      const isSw = lang === 'sw';
      const formattedSales = `KES ${totalSales.toLocaleString('en-KE')}`;
      if (isSw) {
        return `📊 Biashara ya *${businessName}* leo imeweka rekodi!\n` +
          `💰 Mauzo ya Leo: *${formattedSales}* kupitia miamala ${txCount}.\n` +
          `Kila kitu kimehifadhiwa salama kwenye Daftari bila intaneti! 🚀\n\n` +
          `Tumia Daftari bure kwa biashara yako: https://daftari.co.ke`;
      }
      return `📊 *${businessName}* reached a new milestone today!\n` +
        `💰 Today’s Sales: *${formattedSales}* across ${txCount} transactions.\n` +
        `All ledger records stored offline using Daftari! 🚀\n\n` +
        `Get Daftari free for your business: https://daftari.co.ke`;
    },
  },
  {
    id: 'debt_victory',
    title: {
      sw: 'Ushindi wa Madeni: Kumbukumbu za WhatsApp',
      en: 'Debt Recovery Victory',
    },
    generateText: ({ businessName, lang = 'sw' }: StoryParams) => {
      const isSw = lang === 'sw';
      if (isSw) {
        return `🧾 *${businessName}* inafuatilia madeni kwa njia ya kisasa!\n` +
          `Kutuma kumbukumbu za madeni kwa 1-Click WhatsApp kupitia Daftari kunasaidia kurejesha pesa za duka bila kugombana na wateja. 📲✨\n\n` +
          `Sakinisha Daftari bure: https://daftari.co.ke`;
      }
      return `🧾 *${businessName}* is revolutionizing debt collection!\n` +
        `Sending 1-Click WhatsApp reminders via Daftari recovers credit sales while maintaining great customer relationships. 📲✨\n\n` +
        `Install Daftari free: https://daftari.co.ke`;
    },
  },
  {
    id: 'academy_hero',
    title: {
      sw: 'Shujaa wa Maarifa: Daftari Academy',
      en: 'Knowledge Hero: Daftari Academy',
    },
    generateText: ({ businessName, completedLessonsCount, lang = 'sw' }: StoryParams) => {
      const isSw = lang === 'sw';
      if (isSw) {
        return `🎓 Mmiliki wa *${businessName}* ametimiza masomo ${completedLessonsCount}/4 katika Daftari Academy!\n` +
          `Tumejifunza kutenga pesa za biashara na za nyumbani, na kuzuia bidhaa kuisha dukani. 💡📖\n\n` +
          `Jifunze zaidi kwenye Daftari: https://daftari.co.ke`;
      }
      return `🎓 *${businessName}* has completed ${completedLessonsCount}/4 micro-business courses on Daftari Academy!\n` +
        `Mastering profit separation and stock control to scale faster. 💡📖\n\n` +
        `Learn with Daftari free: https://daftari.co.ke`;
    },
  },
  {
    id: 'founder_build_in_public',
    title: {
      sw: 'Hadithi ya Mfanyabiashara (Build in Public)',
      en: 'Founder Journey (Build in Public)',
    },
    generateText: ({ businessName, totalSales, txCount, lang = 'sw' }: StoryParams) => {
      const isSw = lang === 'sw';
      const formattedSales = `KES ${totalSales.toLocaleString('en-KE')}`;
      if (isSw) {
        return `🇰🇪 Hadithi ya Kukuza Biashara Nchini Kenya:\n` +
          `Niko kwenye safari ya kuimarisha *${businessName}*.\n` +
          `Kwa msaada wa Daftari, leo nimekagua miamala ${txCount} yenye thamani ya ${formattedSales} kwa click moja tu 8 PM.\n\n` +
          `Hakuna vitabu vya karatasi vinavyopotea tena! #Daftari #BiasharaKenya #BuildInPublic\n` +
          `https://daftari.co.ke`;
      }
      return `🇰🇪 Growing a Local Kenyan Business:\n` +
        `On a mission to build *${businessName}* with financial discipline.\n` +
        `With Daftari, I recorded ${txCount} transactions worth ${formattedSales} with automatic profit calculation at 8 PM.\n\n` +
        `No more lost paper ledgers! #Daftari #KenyaBusiness #BuildInPublic\n` +
        `https://daftari.co.ke`;
    },
  },
];
