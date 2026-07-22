-- =============================================================
-- Daftari — Complete Schema: All tables that syncAllTables() needs
-- Migration: 20260722000000_create_missing_tables.sql
-- Audited against Dexie v7 schema and syncAll.ts
-- =============================================================

-- ── daftari_businesses (create properly — previously only ALTER'd) ─────────
create table if not exists daftari_businesses (
  id              uuid primary key default gen_random_uuid(),
  local_id        text unique,
  owner_id        uuid references auth.users(id) not null,
  name            text not null,
  owner_name      text,
  currency        text default 'KES',
  category        text,
  subcategory     text,
  payment_methods jsonb default '[]'::jsonb,
  products        jsonb default '[]'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  synced          integer default 1
);

alter table daftari_businesses enable row level security;

drop policy if exists "owner_only_businesses" on daftari_businesses;
create policy "owner_only_businesses" on daftari_businesses
  for all using (owner_id = auth.uid());

create index if not exists idx_businesses_local_id on daftari_businesses(local_id);
create index if not exists idx_businesses_owner_id on daftari_businesses(owner_id);

-- ── daftari_daily_closes ──────────────────────────────────────────────────
create table if not exists daftari_daily_closes (
  id          uuid primary key default gen_random_uuid(),
  local_id    text unique,
  owner_id    uuid references auth.users(id) not null,
  business_id text,
  date        text not null,
  profit      numeric(12,2) not null default 0,
  revenue     numeric(12,2) not null default 0,
  expenses    numeric(12,2) not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  synced      integer default 1
);

alter table daftari_daily_closes enable row level security;

drop policy if exists "owner_only_daily_closes" on daftari_daily_closes;
create policy "owner_only_daily_closes" on daftari_daily_closes
  for all using (owner_id = auth.uid());

create index if not exists idx_daily_closes_local_id on daftari_daily_closes(local_id);
create index if not exists idx_daily_closes_owner_id on daftari_daily_closes(owner_id);
create index if not exists idx_daily_closes_date on daftari_daily_closes(date);

-- ── daftari_customers ─────────────────────────────────────────────────────
create table if not exists daftari_customers (
  id              uuid primary key default gen_random_uuid(),
  local_id        text unique,
  owner_id        uuid references auth.users(id) not null,
  business_id     text,
  name            text not null,
  phone           text,
  total_visits    integer default 0,
  total_spent     numeric(12,2) default 0,
  last_visit      text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  synced          integer default 1
);

alter table daftari_customers enable row level security;

drop policy if exists "owner_only_customers" on daftari_customers;
create policy "owner_only_customers" on daftari_customers
  for all using (owner_id = auth.uid());

create index if not exists idx_customers_local_id on daftari_customers(local_id);
create index if not exists idx_customers_owner_id on daftari_customers(owner_id);

-- ── daftari_suppliers ─────────────────────────────────────────────────────
create table if not exists daftari_suppliers (
  id          uuid primary key default gen_random_uuid(),
  local_id    text unique,
  owner_id    uuid references auth.users(id) not null,
  business_id text,
  name        text not null,
  phone       text,
  email       text,
  address     text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  synced      integer default 1
);

alter table daftari_suppliers enable row level security;

drop policy if exists "owner_only_suppliers" on daftari_suppliers;
create policy "owner_only_suppliers" on daftari_suppliers
  for all using (owner_id = auth.uid());

create index if not exists idx_suppliers_local_id on daftari_suppliers(local_id);
create index if not exists idx_suppliers_owner_id on daftari_suppliers(owner_id);

-- ── daftari_purchase_orders ───────────────────────────────────────────────
create table if not exists daftari_purchase_orders (
  id           uuid primary key default gen_random_uuid(),
  local_id     text unique,
  owner_id     uuid references auth.users(id) not null,
  business_id  text,
  supplier_id  text,
  items        jsonb not null default '[]'::jsonb,
  status       text default 'draft'
               check (status in ('draft','pending','partial','received','cancelled')),
  total_cost   numeric(12,2) default 0,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  synced       integer default 1
);

alter table daftari_purchase_orders enable row level security;

drop policy if exists "owner_only_purchase_orders" on daftari_purchase_orders;
create policy "owner_only_purchase_orders" on daftari_purchase_orders
  for all using (owner_id = auth.uid());

create index if not exists idx_purchase_orders_local_id on daftari_purchase_orders(local_id);
create index if not exists idx_purchase_orders_owner_id on daftari_purchase_orders(owner_id);

-- ── daftari_stock_adjustments ─────────────────────────────────────────────
create table if not exists daftari_stock_adjustments (
  id              uuid primary key default gen_random_uuid(),
  local_id        text unique,
  owner_id        uuid references auth.users(id) not null,
  business_id     text,
  product_id      text not null,
  product_name    text,
  quantity_change integer not null,
  reason          text not null,
  reason_text     text,
  notes           text,
  created_at      timestamptz default now(),
  synced          integer default 1
);

alter table daftari_stock_adjustments enable row level security;

drop policy if exists "owner_only_stock_adjustments" on daftari_stock_adjustments;
create policy "owner_only_stock_adjustments" on daftari_stock_adjustments
  for all using (owner_id = auth.uid());

create index if not exists idx_stock_adjustments_local_id on daftari_stock_adjustments(local_id);
create index if not exists idx_stock_adjustments_owner_id on daftari_stock_adjustments(owner_id);
