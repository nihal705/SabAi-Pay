-- 006_align_bank_accounts_columns_full.sql
--
-- Extends 005_align_bank_accounts_schema.sql. That migration fixed
-- `account_holder_name` being missing from the live bank_accounts table,
-- but the same root cause applies to any column added to
-- schema-postgres.sql's bank_accounts definition AFTER the live table was
-- first created — `CREATE TABLE IF NOT EXISTS` is a no-op on a table that
-- already exists, so it never retroactively adds new columns.
--
-- Confirmed from a live server log: addBankAccount failed first on
-- 'account_holder_name' (before 005 was applied) then on 'ifsc_code' —
-- meaning ifsc_code has the exact same problem and 005 didn't cover it.
--
-- Safe to run more than once; every column uses IF NOT EXISTS.

alter table public.bank_accounts
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists ifsc_code text,
  add column if not exists account_holder_name text,
  add column if not exists upi_id text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists is_verified boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill any rows that predate these columns so the NOT NULL constraints
-- below don't fail on existing data.
update public.bank_accounts set bank_name = 'Unknown Bank' where bank_name is null;
update public.bank_accounts set account_number = 'UNKNOWN' where account_number is null;
update public.bank_accounts set ifsc_code = 'UNKNOWN' where ifsc_code is null;
update public.bank_accounts set account_holder_name = 'Account Holder' where account_holder_name is null or btrim(account_holder_name) = '';

-- Only enforce NOT NULL now that every row has a value — doing this before
-- the backfill above would fail on any pre-existing row.
alter table public.bank_accounts
  alter column bank_name set not null,
  alter column account_number set not null,
  alter column ifsc_code set not null,
  alter column account_holder_name set not null;

-- IMPORTANT — this is very likely the actual fix, not just the column adds:
-- Supabase's PostgREST layer caches your table schema and does not always
-- notice DDL changes made through the SQL Editor right away. After running
-- this (and if you still see "column ... not found in the schema cache"
-- errors for columns that DO exist), reload it explicitly:
--   Supabase Dashboard -> Project Settings -> API -> "Reload schema cache"
-- or run this in the SQL Editor:
--   NOTIFY pgrst, 'reload schema';