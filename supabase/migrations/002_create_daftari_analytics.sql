-- Create the analytics tracking table
CREATE TABLE IF NOT EXISTS daftari_analytics (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event       TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on recorded_at for time-range queries
CREATE INDEX idx_daftari_analytics_recorded_at ON daftari_analytics (recorded_at);

-- Index on event for filtering
CREATE INDEX idx_daftari_analytics_event ON daftari_analytics (event);

-- Secure: enable RLS (only the service_role key can insert/read)
ALTER TABLE daftari_analytics ENABLE ROW LEVEL SECURITY;

-- The service_role (server) can do anything; the anon key gets no access.
CREATE POLICY service_role_all ON daftari_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
