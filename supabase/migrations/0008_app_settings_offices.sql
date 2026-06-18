-- ============================================================================
--  Migration: app_settings (key/value) + offices list for the ID-badge form
-- ============================================================================

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

grant select, insert, update, delete on public.app_settings to authenticated, service_role;

alter table public.app_settings enable row level security;
-- Any signed-in user can read settings (the badge form needs the offices list).
drop policy if exists "app_settings_read" on public.app_settings;
create policy "app_settings_read" on public.app_settings for select
  using (auth.role() = 'authenticated');
-- Only admins can change them.
drop policy if exists "app_settings_write" on public.app_settings;
create policy "app_settings_write" on public.app_settings for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value) values
  ('offices', '["Rochdale (Head Office)","Heywood","Middleton","Bury","Oldham"]'::jsonb)
on conflict (key) do nothing;
