-- Complete transactions table schema fix
DO $$ 
BEGIN
    -- Add all missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'circle') THEN
        ALTER TABLE transactions ADD COLUMN circle TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'mobile_number') THEN
        ALTER TABLE transactions ADD COLUMN mobile_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'operator') THEN
        ALTER TABLE transactions ADD COLUMN operator TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'bill_type') THEN
        ALTER TABLE transactions ADD COLUMN bill_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'customer_id') THEN
        ALTER TABLE transactions ADD COLUMN customer_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'provider') THEN
        ALTER TABLE transactions ADD COLUMN provider TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'failure_reason') THEN
        ALTER TABLE transactions ADD COLUMN failure_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_method_display') THEN
        ALTER TABLE transactions ADD COLUMN payment_method_display TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'gems_used') THEN
        ALTER TABLE transactions ADD COLUMN gems_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'reserve_used') THEN
        ALTER TABLE transactions ADD COLUMN reserve_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'bank_used') THEN
        ALTER TABLE transactions ADD COLUMN bank_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'cashback_earned') THEN
        ALTER TABLE transactions ADD COLUMN cashback_earned INTEGER DEFAULT 0;
    END IF;
END $$;