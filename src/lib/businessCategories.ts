export const BUSINESS_CATEGORIES = {
  food_beverage: {
    icon: 'UtensilsCrossed',
    label: { sw: 'Chakula & Vinywaji', en: 'Food & Beverages' },
    subcategories: {
      chapati_mandazi: { sw: 'Chapati / Mandazi', en: 'Chapati / Mandazi' },
      mama_mboga: { sw: 'Mama Mboga', en: 'Vegetable Seller' },
      juice_bar: { sw: 'Juisi na Matunda', en: 'Juice & Fruits' },
      fast_food: { sw: 'Chakula cha Haraka', en: 'Fast Food' },
      other_food: { sw: 'Chakula Kingine', en: 'Other Food' },
    },
    expenseCategories: [
      { key: 'ingredients', sw: 'Vifaa vya kupikia', en: 'Ingredients' },
      { key: 'packaging', sw: 'Mifuko / Vyombo', en: 'Packaging' },
      { key: 'gas_charcoal', sw: 'Gesi / Mkaa', en: 'Gas / Charcoal' },
      { key: 'transport', sw: 'Usafiri', en: 'Transport' },
      { key: 'rent_stall', sw: 'Pango la sehemu', en: 'Stall Rent' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
  retail: {
    icon: 'ShoppingBag',
    label: { sw: 'Bidhaa & Rejareja', en: 'Retail & Trade' },
    subcategories: {
      kiosk_duka: { sw: 'Kiosk / Duka', en: 'Kiosk / Shop' },
      mtumba: { sw: 'Mtumba', en: 'Secondhand Clothes' },
      electronics: { sw: 'Simu & Elektroniki', en: 'Phones & Electronics' },
      cosmetics: { sw: 'Vipodozi', en: 'Cosmetics & Beauty' },
      household: { sw: 'Vitu vya Nyumbani', en: 'Household Items' },
      other_retail: { sw: 'Bidhaa Nyingine', en: 'Other Goods' },
    },
    expenseCategories: [
      { key: 'stock', sw: 'Bidhaa / Stoo', en: 'Stock / Inventory' },
      { key: 'transport', sw: 'Usafiri', en: 'Transport' },
      { key: 'rent_stall', sw: 'Pango la duka', en: 'Shop Rent' },
      { key: 'packaging', sw: 'Mifuko / Sanduku', en: 'Packaging' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
  jua_kali: {
    icon: 'Hammer',
    label: { sw: 'Jua Kali & Ufundi', en: 'Jua Kali & Artisan' },
    subcategories: {
      welder: { sw: 'Mchomaji / Welder', en: 'Welder' },
      carpenter: { sw: 'Seremala', en: 'Carpenter' },
      cobbler: { sw: 'Fundi wa Viatu', en: 'Cobbler' },
      tailor: { sw: 'Mshonaji', en: 'Tailor' },
      mechanic: { sw: 'Mekaniski', en: 'Mechanic' },
      other_jua_kali: { sw: 'Ufundi Mwingine', en: 'Other Artisan' },
    },
    expenseCategories: [
      { key: 'materials', sw: 'Vifaa / Malighafi', en: 'Materials' },
      { key: 'tools', sw: 'Zana za kazi', en: 'Tools' },
      { key: 'transport', sw: 'Usafiri', en: 'Transport' },
      { key: 'rent_workshop', sw: 'Pango la karakana', en: 'Workshop Rent' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
  agriculture: {
    icon: 'Sprout',
    label: { sw: 'Kilimo & Mifugo', en: 'Agriculture & Livestock' },
    subcategories: {
      crops: { sw: 'Mazao ya Shamba', en: 'Crops' },
      poultry: { sw: 'Kuku & Mayai', en: 'Poultry & Eggs' },
      dairy: { sw: 'Maziwa', en: 'Dairy' },
      other_agri: { sw: 'Kilimo Kingine', en: 'Other Agriculture' },
    },
    expenseCategories: [
      { key: 'seeds_feeds', sw: 'Mbegu / Lishe', en: 'Seeds / Feed' },
      { key: 'labour', sw: 'Malipo ya Wafanyakazi', en: 'Labour' },
      { key: 'transport', sw: 'Usafiri', en: 'Transport' },
      { key: 'fertilizer', sw: 'Mbolea', en: 'Fertilizer / Medicine' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
  services: {
    icon: 'Scissors',
    label: { sw: 'Huduma', en: 'Personal Services' },
    subcategories: {
      salon_barber: { sw: 'Saluni / Kinyozi', en: 'Salon / Barber' },
      laundry: { sw: 'Dobi / Piga Pasi', en: 'Laundry / Ironing' },
      cleaning: { sw: 'Usafi', en: 'Cleaning Services' },
      other_services: { sw: 'Huduma Nyingine', en: 'Other Services' },
    },
    expenseCategories: [
      { key: 'supplies', sw: 'Vifaa vya kazi', en: 'Work Supplies' },
      { key: 'rent', sw: 'Pango', en: 'Rent' },
      { key: 'transport', sw: 'Usafiri', en: 'Transport' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
  transport: {
    icon: 'Bike',
    label: { sw: 'Usafiri', en: 'Transport' },
    subcategories: {
      boda_boda: { sw: 'Boda Boda', en: 'Boda Boda' },
      tuk_tuk: { sw: 'Tuk Tuk', en: 'Tuk Tuk' },
      mkokoteni: { sw: 'Mkokoteni / Baiskeli', en: 'Cart / Bicycle' },
      other_transport: { sw: 'Usafiri Mwingine', en: 'Other Transport' },
    },
    expenseCategories: [
      { key: 'fuel', sw: 'Mafuta', en: 'Fuel' },
      { key: 'repairs', sw: 'Matengenezo', en: 'Repairs' },
      { key: 'insurance', sw: 'Bima', en: 'Insurance / NTSA' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
  professional: {
    icon: 'Briefcase',
    label: { sw: 'Wakala & Huduma za Kitaalamu', en: 'Agents & Professional' },
    subcategories: {
      mpesa_agent: { sw: 'Wakala wa M-Pesa', en: 'M-Pesa Agent' },
      insurance: { sw: 'Wakala wa Bima', en: 'Insurance Agent' },
      other_professional: { sw: 'Huduma Nyingine', en: 'Other Professional' },
    },
    expenseCategories: [
      { key: 'float', sw: 'Float ya M-Pesa', en: 'M-Pesa Float' },
      { key: 'rent', sw: 'Pango', en: 'Rent' },
      { key: 'airtime', sw: 'Airtime / Data', en: 'Airtime / Data' },
      { key: 'other', sw: 'Nyingine', en: 'Other' },
    ],
  },
} as const;

export type BusinessCategoryKey = keyof typeof BUSINESS_CATEGORIES;
export type BusinessCategory = typeof BUSINESS_CATEGORIES[BusinessCategoryKey];
