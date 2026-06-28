CREATE TABLE IF NOT EXISTS daftari_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  local_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'withdrawal')),
  category TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  amount INTEGER NOT NULL,
  description TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced INTEGER DEFAULT 1,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE daftari_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_transactions" ON daftari_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_transactions" ON daftari_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_transactions" ON daftari_transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_transactions" ON daftari_transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_daftari_transactions_user_id ON daftari_transactions(user_id);
CREATE INDEX idx_daftari_transactions_recorded_at ON daftari_transactions(recorded_at DESC);