ALTER TABLE daftari_transactions 
DROP CONSTRAINT IF EXISTS daftari_transactions_type_check,
ADD CONSTRAINT daftari_transactions_type_check 
CHECK (type IN ('income', 'expense', 'withdrawal', 'debt_taken', 'debt_repaid'));