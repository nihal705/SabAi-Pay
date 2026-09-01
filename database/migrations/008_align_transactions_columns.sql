-- 008_align_transactions_columns.sql
--
-- Same root cause as 006/007: schema-postgres.sql's `transactions` table
-- has more columns than your live table does, because the live table
-- predates those additions and CREATE TABLE IF NOT EXISTS never
-- retroactively adds columns to an existing table.
--
-- Confirmed missing from a live query (deposit failed on bank_account_id
-- specifically): bank_account_id, bank_name, gems_used, and — based on
-- what bankRoutes.js and the rest of the app actually insert into this
-- table for sending money / bills / recharges — sender_vpa, receiver_vpa,
-- receiver_name, bill_type, customer_id, provider, mobile_number,
-- operator, failure_reason.
--
-- Everything here is added as NULLABLE with no NOT NULL step at the end
-- (unlike 006's ifsc_code fix) — these are genuinely optional per
-- transaction (a recharge has mobile_number/operator, a bill has
-- bill_type/provider, a send has sender_vpa/receiver_vpa, etc., and no
-- single transaction needs all of them). Safe to run more than once.

alter table public.transactions
  add column if not exists bank_account_id uuid references public.bank_accounts(id) on delete set null,
  add column if not exists bank_name text,
  add column if not exists gems_used integer default 0,
  add column if not exists sender_vpa text,
  add column if not exists receiver_vpa text,
  add column if not exists receiver_name text,
  add column if not exists bill_type text,
  add column if not exists customer_id text,
  add column if not exists provider text,
  add column if not exists mobile_number text,
  add column if not exists operator text,
  add column if not exists failure_reason text;