-- 007_fix_ifsc_column_duplication.sql
--
-- Your live bank_accounts table has a legacy NOT NULL column called `ifsc`
-- that isn't in schema-postgres.sql (the schema file doesn't match the live
-- table — first time we've found that, worth keeping in mind for anything
-- else that errors later). My earlier migration 006 didn't know `ifsc`
-- existed and added a second, separate NOT NULL column `ifsc_code`
-- alongside it — which is what your app actually writes to. Two problems
-- from that, both fixed here:
--
--   1. Inserts now fail on `ifsc` (nothing writes to it any more).
--   2. Migration 006's backfill set ifsc_code = 'UNKNOWN' on every
--      pre-existing row — but those rows had real IFSC codes sitting in
--      the old `ifsc` column the whole time. Step 1 below repairs that
--      before touching any constraints.
--
-- Safe to run more than once.

-- 1. Repair data: copy the real IFSC code from the legacy `ifsc` column
--    back into `ifsc_code` wherever 006 overwrote it with the 'UNKNOWN'
--    placeholder (or left it null/empty).
update public.bank_accounts
set ifsc_code = ifsc
where ifsc is not null
  and btrim(ifsc) <> ''
  and (ifsc_code is null or ifsc_code = 'UNKNOWN' or btrim(ifsc_code) = '');

-- 2. Keep the legacy `ifsc` column (per your instruction, not deleting
--    anything), but stop it from blocking inserts — nothing in the app
--    writes to it any more, so it can no longer be a required field.
--    A trigger keeps it mirrored to ifsc_code going forward, in case
--    anything elsewhere in the app still reads from `ifsc` specifically.
alter table public.bank_accounts alter column ifsc drop not null;

create or replace function sync_ifsc_columns()
returns trigger as $$
begin
  if new.ifsc_code is not null and (new.ifsc is null or new.ifsc <> new.ifsc_code) then
    new.ifsc := new.ifsc_code;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_ifsc_columns on public.bank_accounts;
create trigger trg_sync_ifsc_columns
  before insert or update on public.bank_accounts
  for each row execute function sync_ifsc_columns();