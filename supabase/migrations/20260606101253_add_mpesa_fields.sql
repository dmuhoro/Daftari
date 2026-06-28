ALTER TABLE daftari_transactions 
ADD COLUMN IF NOT EXISTS mpesa_code TEXT,
ADD COLUMN IF NOT EXISTS mpesa_sender TEXT;