# Daftari — Architecture

## Sync Coverage Matrix

| Entity | Dexie Table | Supabase Table | Push | Pull | RLS |
|---|---|---|---|---|---|
| Transactions | transactions | daftari_transactions | ✅ | ✅ | ✅ |
| Business profile | business | daftari_businesses | ✅ | ✅ | ✅ |
| Daily closes | daily_closes | daftari_daily_closes | ✅ | ✅ | ✅ |
| Customers | customers | daftari_customers | ✅ | ✅ | ✅ |
| Suppliers | suppliers | daftari_suppliers | ✅ | ✅ | ✅ |
| Purchase orders | purchase_orders | daftari_purchase_orders | ✅ | ✅ | ✅ |
| Stock adjustments | stock_adjustments | daftari_stock_adjustments | ✅ | ✅ | ✅ |
| Sync queue | sync_queue | (local only) | N/A | N/A | N/A |

Multi-device restore: all 7 entity types pull from Supabase on sign-in.
Push: syncAllTables() pushes all 7 entity types to Supabase when online.
