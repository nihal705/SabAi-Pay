-- Align pre-existing Supabase bank_accounts tables with the application schema.
-- Safe to run more than once. Existing account records keep working.

alter table public.bank_accounts
  add column if not exists account_holder_name text;

update public.bank_accounts
set account_holder_name = 'Account Holder'
where account_holder_name is null or btrim(account_holder_name) = '';

alter table public.bank_accounts
  alter column account_holder_name set default 'Account Holder',
  alter column account_holder_name set not null;

alter table public.bank_accounts
  add column if not exists is_verified boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

