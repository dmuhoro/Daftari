import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, Transaction, type TransactionType } from './db';
import { supabase } from './supabase';
import { addToQueue, type QueuePayload } from '../features/sync/syncQueue';

interface Business {
  id: string;
  name: string;
  owner_name?: string;
  currency: string;
}

interface AppStore {
  language: 'sw' | 'en';
  business: Business | null;
  transactions: Transaction[];
  lastCloseDate: string | null;
  closePromptDismissedAt: number | null;
  setLanguage: (language: 'sw' | 'en') => void;
  setBusiness: (business: Business | null) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  setLastCloseDate: (date: string) => void;
  dismissClosePrompt: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      language: 'sw',
      business: null,
      transactions: [],
      lastCloseDate: null,
      closePromptDismissedAt: null,
      setLanguage: (language) => set({ language }),
      setBusiness: (business) => set({ business }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: async (tx) => {
        const { data: { user } } = await supabase.auth.getUser();
        const txWithUser = { ...tx, user_id: user?.id };

        await db.transactions.add(txWithUser);

        const queuePayload: QueuePayload = {
          local_id: txWithUser.local_id,
          type: txWithUser.type as TransactionType,
          category: txWithUser.category,
          source: txWithUser.source,
          amount: txWithUser.amount,
          description: txWithUser.description,
          recorded_at: txWithUser.recorded_at,
          synced: 0,
          user_id: txWithUser.user_id,
          mpesa_code: txWithUser.mpesa_code,
          mpesa_sender: txWithUser.mpesa_sender,
        };
        await addToQueue('upsert', 'daftari_transactions', txWithUser.local_id, queuePayload);

        set((state) => ({ transactions: [txWithUser, ...state.transactions] }));
      },
      setLastCloseDate: (date) => set({ lastCloseDate: date, closePromptDismissedAt: null }),
      dismissClosePrompt: () => set({ closePromptDismissedAt: Date.now() }),
    }),
    {
      name: 'daftari-store',
      partialize: (state) => ({
        language: state.language,
        business: state.business,
        lastCloseDate: state.lastCloseDate,
        closePromptDismissedAt: state.closePromptDismissedAt,
      }),
    }
  )
);
