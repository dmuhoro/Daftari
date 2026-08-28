export interface QuizOption {
  id: string;
  label: { sw: string; en: string };
  correct: boolean;
}

export interface Quiz {
  question: { sw: string; en: string };
  options: QuizOption[];
  explanation: { sw: string; en: string };
}

export interface Lesson {
  id: string;
  title: { sw: string; en: string };
  category: 'debt' | 'profit' | 'inventory' | 'digital_pay';
  readTimeMinutes: number;
  icon: string;
  summary: { sw: string; en: string };
  content: { sw: string[]; en: string[] };
  quiz: Quiz;
}

export const ACADEMY_LESSONS: Lesson[] = [
  {
    id: 'debt_mastery',
    category: 'debt',
    readTimeMinutes: 2,
    icon: 'Receipt',
    title: {
      sw: 'Jinsi ya Kufuatilia Madeni Bila Kugombana na Wateja',
      en: 'How to Recover Debts Without Losing Customers',
    },
    summary: {
      sw: 'Mbinu za kisasa za kutumia jumbe za WhatsApp kurejesha pesa za madeni bila kuathiri uhusiano na mteja.',
      en: 'Modern strategies using WhatsApp reminders to collect owed money while preserving customer relationships.',
    },
    content: {
      sw: [
        '1. Wazi na Haki: Mteja anapokopa bidhaa, hakikisha unarekodi mara moja kwenye Daftari na jina lake na namba ya simu.',
        '2. Tuma Kumbukumbu kwa Heshima: Baada ya siku 3, tuma ujumbe wa WhatsApp kwa 1-Click kutoka Daftari. Ujumbe huu unaonyesha kiasi halisi na maelezo ya Till/Paybill bila kuonekana kama unamgombeza.',
        '3. Toa Njia Rahisi ya Kulipa: Mteja anapoona namba ya Till au Pochi kwenye ujumbe wa WhatsApp, inakuwa rahisi kwake kutuma pesa papo hapo akiwa nyumbani.',
      ],
      en: [
        '1. Clear Records: The moment a customer takes goods on credit, record it immediately in Daftari with their name and phone number.',
        '2. Polite Reminders: After 3 days, send a 1-Click WhatsApp reminder from Daftari. The message neutrally presents the balance and payment methods.',
        '3. Remove Payment Friction: Providing your Till or Pochi details in the text allows customers to pay immediately from their phone.',
      ],
    },
    quiz: {
      question: {
        sw: 'Ni njia gani bora ya kufuatilia deni la mteja kwa nidhamu?',
        en: 'What is the most effective way to follow up on a customer debt?',
      },
      options: [
        {
          id: 'a',
          label: {
            sw: 'Kumpigia kelele mteja mbele ya watu wengine dukani',
            en: 'Shouting at the customer in front of other shoppers',
          },
          correct: false,
        },
        {
          id: 'b',
          label: {
            sw: 'Kutuma kumbukumbu rasmi ya WhatsApp yenye namba ya Till/Pochi',
            en: 'Sending a formal WhatsApp reminder with Till/Pochi payment info',
          },
          correct: true,
        },
        {
          id: 'c',
          label: {
            sw: 'Kusahau deni na kuacha mteja aende bila kulipa',
            en: 'Forgetting the debt and letting the customer walk away',
          },
          correct: false,
        },
      ],
      explanation: {
        sw: 'Kutuma ujumbe rasmi wa WhatsApp kunaleta uledi, kunapunguza aibu, na kunampa mteja maelezo ya moja kwa moja ya kulipa.',
        en: 'Sending a formal WhatsApp message creates professionalism, removes embarrassment, and gives direct payment options.',
      },
    },
  },
  {
    id: 'profit_separation',
    category: 'profit',
    readTimeMinutes: 2,
    icon: 'Wallet',
    title: {
      sw: 'Mbinu ya Kutenga Pesa za Biashara na za Nyumbani',
      en: 'Separating Duka Money from Family Expenses',
    },
    summary: {
      sw: 'Jifunze kwa nini kuchukua pesa za mauzo kunaua biashara na jinsi ya kujilipa mshahara wako mwenyewe.',
      en: 'Learn why spending daily shop sales on household costs drains capital and how to pay yourself a fixed draw.',
    },
    content: {
      sw: [
        '1. Biashara Sio Mfuko Wako: Pesa zote zinazoingia dukani ni za kununua bidhaa mpya na kulipa gharama. Pesa hizo si faida yako yote.',
        '2. Jilipe Mshahara/Ugawaji: Weka kiasi maalum kila wiki au mwezi ambacho unajilipa kama mmiliki wa biashara.',
        '3. Tumia Daftari Kufunga Siku: Kila siku saa 2 usiku, funga siku yako kwenye Daftari kuona faida halisi baada ya kutoa gharama zote.',
      ],
      en: [
        '1. Duka Cash is Not Personal Cash: Sales money must be reinvested into stock and expenses. Gross cash is not profit.',
        '2. Set an Owner Draw: Decide on a fixed weekly or monthly stipend for yourself instead of picking cash randomly.',
        '3. Close Your Day Daily: Every evening at 8 PM, run Daily Close on Daftari to calculate net profit after subtracting expenses.',
      ],
    },
    quiz: {
      question: {
        sw: 'Kwa nini si vizuri kutoa pesa za mauzo kila saa kununua vitu vya nyumbani?',
        en: 'Why shouldn’t shop owners take cash from daily sales for personal groceries?',
      },
      options: [
        {
          id: 'a',
          label: {
            sw: 'Sababu inamaliza mtaji wa kununua bidhaa mpya na inaficha faida halisi',
            en: 'Because it depletes restocking capital and hides true net profit',
          },
          correct: true,
        },
        {
          id: 'b',
          label: {
            sw: 'Sababu M-Pesa haitakubali kufanya miamala tena',
            en: 'Because M-Pesa will stop processing transactions',
          },
          correct: false,
        },
      ],
      explanation: {
        sw: 'Kutoa pesa za duka ovyo kunamaliza mtaji wa bidhaa mpya bila wewe kutambua.',
        en: 'Uncontrolled cash withdrawals consume restocking capital without you noticing.',
      },
    },
  },
  {
    id: 'stock_optimization',
    category: 'inventory',
    readTimeMinutes: 2,
    icon: 'Package',
    title: {
      sw: 'Kuzuia Bidhaa Kupotea na Kuisha Dukani',
      en: 'Preventing Inventory Leakage & Stock-Outs',
    },
    summary: {
      sw: 'Jinsi ya kuweka viwango vya tahadhari ya bidhaa (Low Stock Alert) na kufanya ukaguzi wa mara kwa mara.',
      en: 'How to set low-stock warning thresholds and run periodic stock counts in Daftari.',
    },
    content: {
      sw: [
        '1. Weka Tahadhari ya Stock (Low Stock Threshold): Bidhaa ikibaki chache (mfano mfuko 5 wa unga), Daftari inakujulisha mara moja.',
        '2. Rekodi Kila Mauzo Papo Hapo: Unapouza bidhaa kutoka POS au Record Sale, stock inapungua moja kwa moja.',
        '3. Kagua Marekebisho ya Stock (Stock Adjustments): Rekodi bidhaa iliyoharibika au kuisha ili hesabu zako zibaki sahihi.',
      ],
      en: [
        '1. Set Low-Stock Thresholds: When stock drops below a limit (e.g., 5 bags of flour), Daftari alerts you automatically.',
        '2. Deduct Stock on Sale: Recording sales from POS or quick chips automatically decrements item stock levels.',
        '3. Log Stock Adjustments: Record damaged or expired goods so your inventory records remain accurate.',
      ],
    },
    quiz: {
      question: {
        sw: 'Ni faida gani kuu ya kuweka Low Stock Threshold kwenye Daftari?',
        en: 'What is the main benefit of setting a Low Stock Threshold in Daftari?',
      },
      options: [
        {
          id: 'a',
          label: {
            sw: 'Kupata taarifa kabla bidhaa haijaisha kabisa ili uweze kuagiza mpya kwa wakati',
            en: 'Receiving an alert before stock runs out so you can reorder in time',
          },
          correct: true,
        },
        {
          id: 'b',
          label: {
            sw: 'Kupunguza bei ya bidhaa kiotomatiki',
            en: 'Automatically discounting product prices',
          },
          correct: false,
        },
      ],
      explanation: {
        sw: 'Low Stock Alert inakuzuia kupoteza wateja wanaokuja kutafuta bidhaa iliyoisha.',
        en: 'Low Stock Alerts prevent you from losing customers due to missing inventory.',
      },
    },
  },
  {
    id: 'digital_pay_mastery',
    category: 'digital_pay',
    readTimeMinutes: 1,
    icon: 'Smartphone',
    title: {
      sw: 'Kurekodi Miamala ya M-Pesa na Till kwa Haraka',
      en: 'Mastering M-Pesa & Till Payment Recording',
    },
    summary: {
      sw: 'Tumia SMS Parser ya Daftari kusoma jumbe za M-Pesa bila intaneti na bila kuandika kwa mikono.',
      en: 'Use Daftari’s offline SMS Parser to read M-Pesa payment texts automatically without typing.',
    },
    content: {
      sw: [
        '1. Nakili Ujumbe wa M-Pesa: Mteja anapolipa kupitia Till, Paybill au Pochi, nakili au weka ujumbe kwenye Daftari.',
        '2. Inatambua Jina na Kiasi Kiotomatiki: Daftari inachambua namba ya muamala, jina la mteja na kiasi bila wewe kuandika.',
        '3. Hakuna Makosa ya Hesabu: Mfumo unahakikisha kiasi kinachoandikwa kinalingana kabisa na ujumbe wa Safaricom.',
      ],
      en: [
        '1. Paste M-Pesa SMS: When a customer pays via Till, Paybill, or Pochi, paste the SMS into Daftari.',
        '2. Auto-Extract Details: Daftari parses the transaction code, sender name, and exact amount automatically.',
        '3. Eliminate Typos: Automated parsing ensures your ledger numbers match Safaricom records perfectly.',
      ],
    },
    quiz: {
      question: {
        sw: 'Je, SMS Parser ya Daftari inahitaji bando la intaneti kufanya kazi?',
        en: 'Does Daftari’s SMS Parser require internet bundle to function?',
      },
      options: [
        {
          id: 'a',
          label: {
            sw: 'Ndio, inahitaji mtandao wa kasi',
            en: 'Yes, it requires high-speed internet',
          },
          correct: false,
        },
        {
          id: 'b',
          label: {
            sw: 'Hapana, inafanya kazi 100% offline bila bando au mtandao',
            en: 'No, it operates 100% offline without data or internet',
          },
          correct: true,
        },
      ],
      explanation: {
        sw: 'Daftari imeundwa kufanya kazi nje ya mtandao (offline-first) kwenye kifaa chako.',
        en: 'Daftari is built offline-first directly on your local device.',
      },
    },
  },
];
