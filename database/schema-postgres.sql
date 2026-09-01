-- SabAI Pay: PostgreSQL/Supabase schema
-- Apply this in a new Supabase project. Do not apply it over an existing
-- production database without taking a backup and reviewing a migration plan.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique check (phone_number ~ '^[0-9]{10}$'),
  email text unique,
  name text not null check (char_length(trim(name)) between 2 and 100),
  password_hash text,
  profile_pic text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  upi_id text unique,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  monthly_limit numeric(12,2) not null default 5000 check (monthly_limit >= 0),
  current_spent numeric(12,2) not null default 0 check (current_spent >= 0),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null check (phone_number ~ '^[0-9]{10}$'),
  otp_hash text not null,
  purpose text not null check (purpose in ('login', 'register', 'reset')),
  attempts integer not null default 0 check (attempts >= 0),
  is_verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists otp_verifications_phone_purpose_idx on otp_verifications(phone_number, purpose, created_at desc);

create table if not exists trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  device_id text not null,
  device_name text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  ifsc_code text not null,
  account_holder_name text not null,
  upi_id text,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, account_number, ifsc_code)
);
create unique index if not exists one_primary_bank_account_per_user on bank_accounts(user_id) where is_primary;

create table if not exists bank_balances (
  bank_account_id uuid primary key references bank_accounts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists bank_upi_pins (
  bank_account_id uuid primary key references bank_accounts(id) on delete cascade,
  pin_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'refunded', 'cancelled')),
  sender_vpa text,
  receiver_vpa text,
  receiver_name text,
  bank_name text,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  description text,
  merchant text,
  category text,
  gems_used integer not null default 0 check (gems_used >= 0),
  reserve_used numeric(12,2) not null default 0 check (reserve_used >= 0),
  bank_used numeric(12,2) not null default 0 check (bank_used >= 0),
  cashback_earned integer not null default 0 check (cashback_earned >= 0),
  bill_type text,
  customer_id text,
  provider text,
  mobile_number text,
  operator text,
  circle text,
  payment_method_display text,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  failure_reason text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_created_idx on transactions(user_id, created_at desc);

create table if not exists sabai_coins (
  user_id uuid primary key references users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null check (amount > 0),
  type text not null check (type in ('earned', 'used', 'expired')),
  source_type text,
  source_id text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists reserve_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  merchant text not null,
  merchant_name text,
  merchant_category text,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  current_spent numeric(12,2) not null default 0 check (current_spent >= 0),
  per_transaction_limit numeric(12,2) check (per_transaction_limit > 0),
  requires_approval boolean not null default false,
  is_active boolean not null default true,
  contributions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, merchant)
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bill_type text not null,
  provider text not null,
  customer_id text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_date date,
  auto_pay boolean not null default false,
  reserve_pay_enabled boolean not null default false,
  reminder_days integer not null default 3 check (reminder_days between 0 and 30),
  bank_account_id uuid references bank_accounts(id) on delete set null,
  bank_name text,
  bank_account_last4 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists paid_bills (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  payment_breakdown jsonb not null default '{}'::jsonb,
  cashback_earned integer not null default 0,
  transaction_id text references transactions(transaction_id) on delete set null,
  paid_at timestamptz not null default now()
);

create table if not exists recent_recharges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  mobile_number text not null,
  operator text,
  operator_id text,
  amount numeric(12,2) not null check (amount > 0),
  circle text,
  transaction_id text references transactions(transaction_id) on delete set null,
  cashback_earned integer not null default 0,
  payment_method text,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  vpa text not null,
  phone text,
  sent_count integer not null default 0,
  received_count integer not null default 0,
  total_sent numeric(12,2) not null default 0,
  total_received numeric(12,2) not null default 0,
  last_transaction_at timestamptz,
  unique (user_id, vpa)
);

create table if not exists money_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  requester_vpa text,
  requester_name text,
  recipient_vpa text,
  recipient_name text,
  description text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists split_requests (
  id uuid primary key default gen_random_uuid(),
  split_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  total_amount numeric(12,2) not null check (total_amount > 0),
  split_type text not null,
  group_name text,
  note text,
  splits jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists merchant_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  merchant_id text not null,
  merchant_name text,
  is_connected boolean not null default true,
  location_address text,
  location_city text,
  location_area text,
  location_coordinates jsonb,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, merchant_id)
);

create table if not exists order_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  merchant text,
  merchant_info jsonb,
  cart jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  step text not null default 'init',
  preferences jsonb,
  is_scheduled boolean not null default false,
  scheduled_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  merchant text not null,
  merchant_name text,
  items jsonb not null,
  total_amount numeric(12,2) not null check (total_amount > 0),
  payment_method text,
  payment_id text,
  sabai_gems integer not null default 0,
  status text not null default 'confirmed',
  estimated_delivery text,
  tracking jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auto_pay_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id text not null unique,
  type text,
  merchant text,
  merchant_name text,
  amount numeric(12,2) not null check (amount > 0),
  schedule text not null,
  date_value integer,
  month_value integer,
  time time,
  one_time_date date,
  payment_method text,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  bank_name text,
  bank_account_last4 text,
  payment_breakdown jsonb not null default '{}'::jsonb,
  reminder_days integer not null default 3,
  customer_id text,
  bill_type text,
  provider text,
  mobile_number text,
  operator text,
  circle text,
  bill_id uuid references bills(id) on delete cascade,
  status text not null default 'active',
  next_execution timestamptz,
  execution_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scheduled_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_data jsonb not null,
  scheduled_time timestamptz not null,
  status text not null default 'scheduled',
  payment_method text,
  payment_breakdown jsonb not null default '{}'::jsonb,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  executed_at timestamptz,
  result jsonb,
  error text,
  retry_count integer not null default 0,
  last_error text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references agent_conversations(conversation_id) on delete cascade,
  role text not null check (role in ('user', 'agent', 'system')),
  content text not null,
  session_id text,
  cart jsonb,
  total numeric(12,2),
  requires_action boolean not null default false,
  merchant text,
  created_at timestamptz not null default now()
);

create table if not exists weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  challenge_id integer not null,
  progress jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  claimed boolean not null default false,
  completed_at timestamptz,
  claimed_at timestamptz,
  unique (user_id, challenge_id)
);
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  priority text not null default 'normal',
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create or replace procedure add_updated_at_trigger(p_table regclass) language plpgsql as $$
begin
  execute format('drop trigger if exists set_updated_at on %s; create trigger set_updated_at before update on %s for each row execute function set_updated_at()', p_table, p_table);
end $$;
call add_updated_at_trigger('users'); call add_updated_at_trigger('bank_accounts');
call add_updated_at_trigger('reserve_limits'); call add_updated_at_trigger('bills');
call add_updated_at_trigger('money_requests'); call add_updated_at_trigger('split_requests');
call add_updated_at_trigger('merchant_connections'); call add_updated_at_trigger('order_sessions');
call add_updated_at_trigger('agent_orders'); call add_updated_at_trigger('auto_pay_orders');
call add_updated_at_trigger('scheduled_orders'); call add_updated_at_trigger('agent_conversations');

-- Atomic operations prevent concurrent requests from overspending a balance or limit.
create or replace function update_bank_balance(p_account_id uuid, p_delta numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_balance numeric;
begin
  update bank_balances set balance = balance + p_delta, updated_at = now()
  where bank_account_id = p_account_id and balance + p_delta >= 0
  returning balance into v_balance;
  if v_balance is null then raise exception 'Insufficient balance or account not found'; end if;
  return v_balance;
end $$;

-- A self-transfer must be all-or-nothing. This function verifies that both
-- accounts belong to the caller, locks their balance rows and records the
-- resulting ledger entry before returning either new balance.
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

create or replace function increment_otp_attempt(p_otp_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update otp_verifications set attempts = attempts + 1 where id = p_otp_id;
end $$;

create or replace function update_coin_balance(p_user_id uuid, p_delta integer)
returns table(balance integer, lifetime_earned integer, lifetime_used integer)
language plpgsql security definer set search_path = public as $$
begin
  insert into sabai_coins(user_id) values (p_user_id) on conflict (user_id) do nothing;
  return query update sabai_coins set
    balance = sabai_coins.balance + p_delta,
    lifetime_earned = sabai_coins.lifetime_earned + greatest(p_delta, 0),
    lifetime_used = sabai_coins.lifetime_used + greatest(-p_delta, 0),
    updated_at = now()
  where sabai_coins.user_id = p_user_id and sabai_coins.balance + p_delta >= 0
  returning sabai_coins.balance, sabai_coins.lifetime_earned, sabai_coins.lifetime_used;
  if not found then raise exception 'Insufficient SabAI Gems'; end if;
end $$;

create or replace function spend_reserve_limit(p_user_id uuid, p_merchant text, p_amount numeric)
returns table(current_spent numeric, remaining numeric)
language plpgsql security definer set search_path = public as $$
begin
  return query update reserve_limits set current_spent = reserve_limits.current_spent + p_amount, updated_at = now()
  where user_id = p_user_id and merchant = p_merchant and is_active
    and current_spent + p_amount <= monthly_limit
    and (per_transaction_limit is null or p_amount <= per_transaction_limit)
  returning reserve_limits.current_spent, reserve_limits.monthly_limit - reserve_limits.current_spent;
  if not found then raise exception 'Reserve Pay limit is unavailable or insufficient'; end if;
end $$;

-- The backend uses the service-role key and enforces authorization itself.
-- Do not expose this key to the browser. RLS remains enabled for all browser roles.
alter table users enable row level security; alter table bank_accounts enable row level security;
alter table otp_verifications enable row level security;
alter table bank_balances enable row level security; alter table bank_upi_pins enable row level security;
alter table transactions enable row level security; alter table sabai_coins enable row level security;
alter table coin_transactions enable row level security; alter table reserve_limits enable row level security;
alter table bills enable row level security; alter table paid_bills enable row level security;
alter table recent_recharges enable row level security; alter table contacts enable row level security;
alter table money_requests enable row level security; alter table split_requests enable row level security;
alter table merchant_connections enable row level security; alter table order_sessions enable row level security;
alter table agent_orders enable row level security; alter table auto_pay_orders enable row level security;
alter table scheduled_orders enable row level security; alter table agent_conversations enable row level security;
alter table agent_messages enable row level security; alter table weekly_challenges enable row level security;
alter table notifications enable row level security; alter table trusted_devices enable row level security;
