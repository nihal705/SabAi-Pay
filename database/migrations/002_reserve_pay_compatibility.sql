-- SabAI Pay Reserve Pay schema upgrade
-- Run this once in the Supabase SQL editor.

begin;

alter table public.reserve_limits
  add column if not exists merchant_name text,
  add column if not exists merchant_category text,
  add column if not exists current_spent numeric(12,2) not null default 0,
  add column if not exists per_transaction_limit numeric(12,2),
  add column if not exists requires_approval boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists contributions jsonb not null default '[]'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.reserve_limits
  drop constraint if exists reserve_limits_current_spent_check;
alter table public.reserve_limits
  add constraint reserve_limits_current_spent_check check (current_spent >= 0);

alter table public.reserve_limits
  drop constraint if exists reserve_limits_monthly_limit_check;
alter table public.reserve_limits
  add constraint reserve_limits_monthly_limit_check check (monthly_limit >= 0);

create unique index if not exists reserve_limits_user_merchant_unique
  on public.reserve_limits(user_id, merchant);

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
  update public.reserve_limits
  set current_spent = reserve_limits.current_spent + p_amount,
      updated_at = now()
  where user_id = p_user_id
    and merchant = p_merchant
    and is_active
    and current_spent + p_amount <= monthly_limit
    and (per_transaction_limit is null or p_amount <= per_transaction_limit)
  returning reserve_limits.current_spent,
            reserve_limits.monthly_limit - reserve_limits.current_spent;

  if not found then
    raise exception 'Reserve Pay limit is unavailable or insufficient';
  end if;
end;
$$;

commit;
