import { useState, useEffect } from 'react';
import { ChevronLeft, Users } from 'lucide-react';
import { getAllBusinesses, getAllTransactions } from '../lib/repository';

interface AdminScreenProps {
  onBack: () => void;
}

export default function AdminScreen({ onBack }: AdminScreenProps) {
  const [businesses, setBusinesses] = useState<Array<{ name: string; category?: string; createdAt?: string; txCount7d: number; totalTx: number; lastActive: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const bizResult = await getAllBusinesses();
      const txResult = await getAllTransactions();
      const bizList = bizResult.ok ? bizResult.value : [];
      const txList = txResult.ok ? txResult.value : [];
      const now = Date.now();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

      const enriched = bizList.map(biz => {
        const bizTx = txList.filter(t => t.business_id === biz.user_id || t.business_id === biz.local_id);
        const recentTx = bizTx.filter(t => t.recorded_at >= sevenDaysAgo);
        const lastTx = bizTx.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
        return {
          name: biz.name,
          category: biz.category,
          createdAt: biz.created_at,
          txCount7d: recentTx.length,
          totalTx: bizTx.length,
          lastActive: lastTx?.recorded_at || '—',
        };
      });

      setBusinesses(enriched);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4">
        <div className="flex items-center h-14 gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-stone-800 -ml-1" aria-label="Back">
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <span className="font-bold text-ink dark:text-stone-100 text-base">Admin</span>
        </div>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs font-medium text-muted dark:text-stone-400 uppercase tracking-wider">
          Beta Cohort ({businesses.length} businesses)
        </p>
        {loading ? (
          <p className="text-sm text-muted dark:text-stone-400">Loading...</p>
        ) : businesses.length === 0 ? (
          <p className="text-sm text-muted dark:text-stone-400 py-8 text-center">No businesses registered yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {businesses.map((biz, i) => (
              <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold text-ink dark:text-stone-100">{biz.name}</span>
                  </div>
                  <span className="text-xs bg-stone-100 dark:bg-stone-800 text-muted dark:text-stone-400 px-2 py-0.5 rounded-full">{biz.category}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted dark:text-stone-400">
                  <div>
                    <p className="font-medium text-ink dark:text-stone-100">{biz.txCount7d}</p>
                    <p>Tx (7d)</p>
                  </div>
                  <div>
                    <p className="font-medium text-ink dark:text-stone-100">{biz.totalTx}</p>
                    <p>Total Tx</p>
                  </div>
                  <div>
                    <p className="font-medium text-ink dark:text-stone-100">{biz.lastActive === '—' ? '—' : new Date(biz.lastActive).toLocaleDateString()}</p>
                    <p>Last active</p>
                  </div>
                </div>
                {biz.createdAt && <p className="text-[10px] text-muted dark:text-stone-400 mt-2">Joined {new Date(biz.createdAt).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
