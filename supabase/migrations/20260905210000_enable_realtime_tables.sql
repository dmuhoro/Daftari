-- =============================================================
-- Daftari — Enable realtime for multi-device live updates
-- Migration: 20260905210000_enable_realtime_tables.sql
-- Referenced by src/hooks/useRealtimeSync.ts (postgres_changes on
-- daftari_transactions + daftari_businesses).
--
-- postgres_changes only streams rows for tables that are members of
-- the supabase_realtime publication. Without this, subscriptions
-- connect (SUBSCRIBED) but NO events are delivered. RLS still scopes
-- the stream per session — this only turns on the WAL feed, it does
-- not weaken tenant isolation.
--
-- Apply via project SQL editor on rjedivbpldkroffswoyb (or a linked
-- CLI: supabase db push after login). Idempotent.
-- =============================================================

alter publication supabase_realtime add table public.daftari_transactions;
alter publication supabase_realtime add table public.daftari_businesses;