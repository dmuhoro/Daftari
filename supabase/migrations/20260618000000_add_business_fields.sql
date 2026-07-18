-- Add category, subcategory, payment_methods, and products columns to daftari_businesses
ALTER TABLE daftari_businesses
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS products jsonb DEFAULT '[]'::jsonb;
