-- =============================================================
-- Daftari — Push subscription storage for web push notifications
-- Migration: 20260824000000_create_push_subscriptions.sql
-- Referenced by src/lib/repository.ts (upsertPushSubscription /
-- deletePushSubscription) and src/lib/pushNotifications.ts.
-- Was missing from migrations while referenced in production code.
-- =============================================================

create table if not exists daftari_push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  subscription text not null,
  created_at   timestamptz default now()
);

alter table daftari_push_subscriptions enable row level security;

drop policy if exists "owner_only_push_subscriptions" on daftari_push_subscriptions;
create policy "owner_only_push_subscriptions" on daftari_push_subscriptions
  for all using (user_id = auth.uid());

create index if not exists idx_push_subscriptions_user_id on daftari_push_subscriptions(user_id);
