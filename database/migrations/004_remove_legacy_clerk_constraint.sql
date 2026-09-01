-- SabAI Pay no longer uses Clerk. Older database copies can still contain a
-- required clerk_id column, which prevents the custom JWT registration flow.
-- Preserve any historical value but make it optional; the app never reads it.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'clerk_id'
  ) then
    alter table public.users alter column clerk_id drop not null;
  end if;
end $$;
