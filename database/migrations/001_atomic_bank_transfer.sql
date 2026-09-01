-- Run this once in the Supabase SQL editor after schema-postgres.sql.
create or replace function transfer_between_bank_accounts(
  p_user_id uuid, p_from_account_id uuid, p_to_account_id uuid, p_amount numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_from_name text; v_to_name text; v_from_balance numeric; v_to_balance numeric; v_transaction_id text;
begin
  if p_amount is null or p_amount <= 0 or p_from_account_id = p_to_account_id then raise exception 'Invalid transfer request'; end if;
  select bank_name into v_from_name from bank_accounts where id = p_from_account_id and user_id = p_user_id;
  select bank_name into v_to_name from bank_accounts where id = p_to_account_id and user_id = p_user_id;
  if v_from_name is null or v_to_name is null then raise exception 'Bank account not found or does not belong to user'; end if;
  perform 1 from bank_balances where bank_account_id in (p_from_account_id, p_to_account_id) order by bank_account_id for update;
  update bank_balances set balance = balance - p_amount, updated_at = now() where bank_account_id = p_from_account_id and balance >= p_amount returning balance into v_from_balance;
  if v_from_balance is null then raise exception 'Insufficient balance'; end if;
  update bank_balances set balance = balance + p_amount, updated_at = now() where bank_account_id = p_to_account_id returning balance into v_to_balance;
  if v_to_balance is null then raise exception 'Destination account balance not found'; end if;
  v_transaction_id := 'TRF' || floor(extract(epoch from clock_timestamp()) * 1000)::text || floor(random() * 1000)::text;
  insert into transactions (transaction_id, user_id, type, amount, status, bank_name, bank_account_id, description, bank_used)
  values (v_transaction_id, p_user_id, 'self_transfer', p_amount, 'success', v_from_name, p_from_account_id, format('Self transfer from %s to %s', v_from_name, v_to_name), p_amount);
  return jsonb_build_object('transactionId', v_transaction_id, 'fromBalance', v_from_balance, 'toBalance', v_to_balance);
end $$;
