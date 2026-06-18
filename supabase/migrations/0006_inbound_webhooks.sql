-- ============================================================================
--  Migration: inbound webhooks (API keys + log) + profile metadata
-- ============================================================================

alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.api_keys (
  id text primary key,
  name text not null,
  key text not null unique,
  revoked boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inbound_events (
  id uuid primary key default gen_random_uuid(),
  endpoint text,
  ok boolean,
  status integer,
  summary text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.api_keys to authenticated, service_role;
grant select, insert, update, delete on public.inbound_events to authenticated, service_role;

-- Admin-only (keys are secrets). Inbound endpoints validate via the service role.
alter table public.api_keys enable row level security;
drop policy if exists "api_keys_admin" on public.api_keys;
create policy "api_keys_admin" on public.api_keys for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.inbound_events enable row level security;
drop policy if exists "inbound_admin_read" on public.inbound_events;
create policy "inbound_admin_read" on public.inbound_events for select
  using (public.is_admin());
