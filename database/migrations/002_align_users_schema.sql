-- Align an older SabAI Pay users table with the Supabase-backed application.
-- Safe for the original prototype schema: it preserves an existing `phone`
-- column by renaming it, then supplies newly required profile/auth fields.

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'phone')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'phone_number') then
    alter table public.users rename column phone to phone_number;
  end if;
end $$;

alter table public.users add column if not exists phone_number text;
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists profile_pic text;
alter table public.users add column if not exists date_of_birth date;
alter table public.users add column if not exists gender text;
alter table public.users add column if not exists upi_id text;
alter table public.users add column if not exists is_verified boolean not null default false;
alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists monthly_limit numeric(12,2) not null default 5000;
alter table public.users add column if not exists current_spent numeric(12,2) not null default 0;
alter table public.users add column if not exists last_login timestamptz;
alter table public.users add column if not exists updated_at timestamptz not null default now();

-- Old rows stay usable and new rows receive unique application identifiers.
update public.users
set upi_id = phone_number || '@sabai'
where upi_id is null and phone_number is not null;

create unique index if not exists users_phone_number_unique_idx on public.users(phone_number) where phone_number is not null;
create unique index if not exists users_upi_id_unique_idx on public.users(upi_id) where upi_id is not null;
