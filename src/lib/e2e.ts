import { addBusiness, saveTransaction, getAllTransactions } from './repository';
import { useStore } from './store';

export const E2E_BUSINESS_ID = 'e2e-user';
export const E2E_BUSINESS_LOCAL_ID = 'e2e-biz-1';

export async function seedE2eData(): Promise<void> {
  const testBiz = {
    local_id: E2E_BUSINESS_LOCAL_ID,
    name: 'Test Shop',
    owner_name: 'Test Owner',
    currency: 'KES',
    user_id: E2E_BUSINESS_ID,
    category: 'retail',
    subcategory: 'general',
    payment_methods: JSON.stringify(['cash', 'mpesa']),
    products: JSON.stringify([
      { id: 'p1', name: 'Soda', price: 50, stock: 100 },
      { id: 'p2', name: 'Bread', price: 80, stock: 50 },
    ]),
    created_at: new Date().toISOString(),
    synced: 1,
  };
  await addBusiness(testBiz);

  const now = new Date().toISOString();
  const testTxs = [
    { local_id: 'tx-1', type: 'income' as const, category: 'product_sale', source: 'manual', amount: 500, recorded_at: now, synced: 1, business_id: E2E_BUSINESS_LOCAL_ID },
    { local_id: 'tx-2', type: 'income' as const, category: 'product_sale', source: 'manual', amount: 350, recorded_at: now, synced: 1, business_id: E2E_BUSINESS_LOCAL_ID },
    { local_id: 'tx-3', type: 'expense' as const, category: 'rent', source: 'manual', amount: 200, recorded_at: now, synced: 1, business_id: E2E_BUSINESS_LOCAL_ID },
  ];
  for (const tx of testTxs) await saveTransaction(tx);

  const allTxs = await getAllTransactions();
  const mapped = [{
    id: E2E_BUSINESS_ID,
    local_id: E2E_BUSINESS_LOCAL_ID,
    name: testBiz.name,
    owner_name: testBiz.owner_name,
    currency: testBiz.currency,
    category: testBiz.category,
    subcategory: testBiz.subcategory,
    payment_methods: ['cash', 'mpesa'] as string[],
    products: [{ id: 'p1', name: 'Soda', price: 50, stock: 100 }, { id: 'p2', name: 'Bread', price: 80, stock: 50 }],
  }];

  const store = useStore.getState();
  store.setBusinesses(mapped);
  store.setBusiness(mapped[0]);
  store.setActiveBusinessId(mapped[0].id);
  if (allTxs.ok) store.setTransactions(allTxs.value);
}
