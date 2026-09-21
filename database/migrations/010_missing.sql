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



-- Fix ambiguous column reference in spend_reserve_limit
drop function if exists public.spend_reserve_limit(uuid, text, numeric);

create or replace function public.spend_reserve_limit(
  p_user_id uuid,
  p_merchant text,
  p_amount numeric
)
returns table(current_spent numeric, remaining numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Reserve Pay amount must be positive';
  end if;

  return query
  update public.reserve_limits rl
  set current_spent = rl.current_spent + p_amount,
      updated_at = now()
  where rl.user_id = p_user_id
    and rl.merchant = p_merchant
    and rl.is_active
    and rl.current_spent + p_amount <= rl.monthly_limit
    and (rl.per_transaction_limit is null or p_amount <= rl.per_transaction_limit)
  returning rl.current_spent,
            rl.monthly_limit - rl.current_spent;
  if not found then
    raise exception 'Reserve Pay limit is unavailable or insufficient';
  end if;
end;
$$;



CREATE OR REPLACE FUNCTION public.spend_reserve_limit(
  p_user_id uuid,
  p_merchant text,
  p_amount numeric
)
RETURNS TABLE(current_spent numeric, remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Reserve Pay amount must be positive';
  END IF;

  RETURN QUERY
  UPDATE public.reserve_limits rl
  SET current_spent = rl.current_spent + p_amount,
      updated_at = NOW()
  WHERE rl.user_id = p_user_id
    AND rl.merchant = p_merchant
    AND rl.is_active
    AND rl.current_spent + p_amount <= rl.monthly_limit
    AND (rl.per_transaction_limit IS NULL OR p_amount <= rl.per_transaction_limit)
  RETURNING rl.current_spent, rl.monthly_limit - rl.current_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserve Pay limit is unavailable or insufficient';
  END IF;
END;
$$;