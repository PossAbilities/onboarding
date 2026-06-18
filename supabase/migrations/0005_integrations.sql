-- ============================================================================
--  Migration: outbound integrations (webhooks) + delivery log
--  These hold API keys/headers, so they are ADMIN-ONLY (not readable by
--  regular authenticated users). The dispatcher reads them via the service role.
-- ============================================================================

create table if not exists public.integrations (
  id text primary key,
  name text not null,
  event text not null,
  enabled boolean not null default false,
  method text not null default 'POST',
  url text,
  headers jsonb not null default '[]'::jsonb,
  body_template text,
  updated_at timestamptz default now()
);

create table if not exists public.integration_deliveries (
  id uuid primary key default gen_random_uuid(),
  integration_id text,
  integration_name text,
  event text,
  status_code integer,
  ok boolean,
  error text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.integrations to authenticated, service_role;
grant select, insert, update, delete on public.integration_deliveries to authenticated, service_role;

alter table public.integrations enable row level security;
drop policy if exists "integrations_admin" on public.integrations;
create policy "integrations_admin" on public.integrations for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.integration_deliveries enable row level security;
drop policy if exists "deliveries_admin_read" on public.integration_deliveries;
create policy "deliveries_admin_read" on public.integration_deliveries for select
  using (public.is_admin());

-- Example (disabled) integration: photo.submitted -> create an ID badge task.
insert into public.integrations (id, name, event, enabled, method, url, headers, body_template) values
  ('intg-idbadge','Create ID badge task','photo.submitted',false,'POST','https://your-task-system.example.com/api/tasks',
   '[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer YOUR_API_KEY"}]'::jsonb,
   '{"title":"Create ID badge for {{full_name}}","assignee_team":"Facilities","fields":{"name":"{{full_name}}","role":"{{role}}","department":"{{department}}","photo_url":"{{photo_url}}"}}')
on conflict (id) do nothing;
