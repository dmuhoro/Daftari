-- =============================================================
-- Daftari — Reconcile remote schema to the application's user_id
-- ownership model + sync columns.
-- Migration: 20260825000000_reconcile_user_id_schema.sql
--
-- Background: the remote Supabase project was created out-of-band
-- (only 002 and 20260607053211 recorded in schema_migrations). The
-- pre-existing daftari_businesses / daftari_transactions tables carry
-- a legacy schema (owner_id, type) that does not match what the app
-- syncs (user_id, category, products, payment_methods, ...). As a
-- result cloud upserts error and businesses/transactions never back up.
--
-- This migration is idempotent (IF NOT EXISTS) and aligns the remote
-- schema + RLS for ALL seven sync tables to the application's
-- user_id ownership model:
--   * daftari_businesses / daftari_transactions → RLS user_id = auth.uid()
--   * customers / daily_closes / suppliers / purchase_orders /
--     stock_adjustments → RLS business_id ∈ user's business local_ids
--   * owner_id made nullable everywhere (the app writes user_id, and
--     business_id = business.local_id, never owner_id).
-- =============================================================

-- ── daftari_businesses: add missing sync columns ─────────────────────────
alter table daftari_businesses
  add column if not exists user_id       uuid references auth.users(id),
  add column if not exists owner_name    text,
  add column if not exists category      text,
  add column if not exists subcategory   text,
  add column if not exists payment_methods jsonb default '[]'::jsonb,
  add column if not exists products      jsonb default '[]'::jsonb,
  add column if not exists updated_at    timestamptz default now(),
  add column if not exists synced        integer default 1;

-- The application writes ownership via `user_id`, never `owner_id`.
-- The legacy `owner_id` column must be nullable so app upserts succeed.
alter table daftari_businesses alter column owner_id drop not null;

create index if not exists idx_businesses_user_id on daftari_businesses(user_id);

-- ── daftari_transactions: add missing sync columns ───────────────────────
alter table daftari_transactions
  add column if not exists user_id        uuid references auth.users(id),
  add column if not exists synced         integer default 1,
  add column if not exists payment_method text,
  add column if not exists receipt_id     text,
  add column if not exists product_id     text,
  add column if not exists cost_price     numeric(12,2),
  add column if not exists updated_at     timestamptz default now();

-- Application `business_id` is optional (nullable in Transaction interface);
-- must not be NOT NULL or app upserts for uncategorized transactions fail.
alter table daftari_transactions alter column business_id drop not null;

create index if not exists idx_transactions_user_id on daftari_transactions(user_id);

-- ── RLS: align both tables to user_id = auth.uid() ownership model ───────
-- The application reads/writes with user_id = auth.uid(). Replace the
-- legacy owner_id-based policies (businesses) and business.id-join
-- policy (transactions) with the user_id model.

drop policy if exists "owner_only_businesses" on daftari_businesses;
create policy "owner_only_businesses" on daftari_businesses
  for all using (user_id = auth.uid());

drop policy if exists "owner_only_transactions" on daftari_transactions;
create policy "owner_only_transactions" on daftari_transactions
  for all using (user_id = auth.uid());

-- ── Business-scoped tables (customers, daily_closes, suppliers,
--    purchase_orders, stock_adjustments) ──────────────────────────────────
-- The application identifies ownership through the parent business's
-- user_id, and writes these rows with business_id = business.local_id
-- (never owner_id). Drop the legacy NOT NULL owner_id and scope RLS by
-- business_id → the user's own businesses' local_id.

alter table daftari_customers         alter column owner_id drop not null;
alter table daftari_daily_closes      alter column owner_id drop not null;
alter table daftari_suppliers         alter column owner_id drop not null;
alter table daftari_purchase_orders   alter column owner_id drop not null;
alter table daftari_stock_adjustments alter column owner_id drop not null;

drop policy if exists "owner_only_customers" on daftari_customers;
create policy "owner_only_customers" on daftari_customers
  for all using (business_id in (select local_id from daftari_businesses where user_id = auth.uid()));

drop policy if exists "owner_only_daily_closes" on daftari_daily_closes;
create policy "owner_only_daily_closes" on daftari_daily_closes
  for all using (business_id in (select local_id from daftari_businesses where user_id = auth.uid()));

drop policy if exists "owner_only_suppliers" on daftari_suppliers;
create policy "owner_only_suppliers" on daftari_suppliers
  for all using (business_id in (select local_id from daftari_businesses where user_id = auth.uid()));

drop policy if exists "owner_only_purchase_orders" on daftari_purchase_orders;
create policy "owner_only_purchase_orders" on daftari_purchase_orders
  for all using (business_id in (select local_id from daftari_businesses where user_id = auth.uid()));

drop policy if exists "owner_only_stock_adjustments" on daftari_stock_adjustments;
create policy "owner_only_stock_adjustments" on daftari_stock_adjustments
  for all using (business_id in (select local_id from daftari_businesses where user_id = auth.uid()));
