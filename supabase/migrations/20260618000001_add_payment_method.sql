-- Add payment_method column to daftari_transactions
ALTER TABLE daftari_transactions
ADD COLUMN IF NOT EXISTS payment_method text;
