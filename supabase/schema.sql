-- ============================================================================
--  PossAbilities Onboarding — Supabase schema
--  Run this in the Supabase SQL Editor (Project → SQL → New query), then run
--  seed.sql. Safe to re-run (idempotent where practical).
-- ============================================================================

-- ── Profiles (one row per auth user) ───────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role_tag text default 'New Starter',
  department text,
  manager_id text,
  avatar_url text,
  is_admin boolean not null default false,
  journey_points integer not null default 0,
  status text not null default 'invited', -- invited | active | completed
  started_at timestamptz,
  last_activity_at timestamptz,
  invited_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── Content catalogue (optional — app ships with the same data as seed) ─────
create table if not exists public.modules (
  id text primary key,
  slug text unique not null,
  "order" integer not null,
  level integer not null,
  kind text not null,
  title text not null,
  short_title text not null,
  description text,
  est_minutes integer default 5,
  required boolean default true,
  badge_id text,
  reward_xp integer default 0,
  hero_media_url text,
  hero_poster text,
  icon text,
  content jsonb default '[]'::jsonb
);

create table if not exists public.directors (
  id text primary key,
  name text not null,
  role text,
  bio text,
  photo_url text,
  video_url text,
  "order" integer default 0
);

create table if not exists public.managers (
  id text primary key,
  name text not null,
  role text,
  department text,
  bio text,
  photo_url text,
  video_url text,
  calendar_url text,
  "order" integer default 0
);

create table if not exists public.benefits (
  id text primary key,
  category text,
  title text not null,
  description text,
  icon text,
  "order" integer default 0,
  highlight boolean default false
);

create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text,
  icon text,
  xp integer default 0,
  criteria text
);

create table if not exists public.pets (
  id text primary key,
  name text not null,
  species text,
  owner text,
  photo_url text,
  fun_fact text
);

create table if not exists public.locations (
  id text primary key,
  name text not null,
  region text,
  description text,
  image_url text,
  services text[] default '{}'
);

-- PossAbilities values for the culture Values-Match game.
-- Named company_values because "values" is a reserved SQL keyword.
create table if not exists public.company_values (
  id text primary key,
  label text not null,
  icon text default 'star',
  match text,
  "order" integer default 0
);

-- Documents starters must read and digitally sign.
create table if not exists public.documents (
  id text primary key,
  title text not null,
  description text,
  body text,
  file_url text,
  required boolean default true,
  "order" integer default 0
);

create table if not exists public.document_signatures (
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id text not null,
  signed_name text,
  signature_data text,
  signed_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

-- HTML email templates (with {{merge_tags}}) managed from the admin dashboard.
create table if not exists public.email_templates (
  id text primary key,
  name text not null,
  trigger text default 'custom',
  subject text,
  html text,
  enabled boolean default false,
  updated_at timestamptz default now()
);

-- ── Per-user dynamic data ───────────────────────────────────────────────────
create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id text not null,
  status text not null default 'available', -- locked|available|in_progress|completed
  completed_at timestamptz,
  score integer,
  primary key (user_id, module_id)
);

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.easter_eggs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  egg_id text not null,
  primary key (user_id, egg_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  icon text default 'notifications',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Encrypted credential vault (app-encrypted secrets, owner-only).
create table if not exists public.user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  username text,
  secret_enc text,
  url text,
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text,
  author_avatar text,
  title text not null,
  description text,
  category text,
  status text not null default 'submitted',
  votes integer not null default 1,
  created_at timestamptz not null default now()
);

-- Outbound integrations (webhooks) + delivery log — admin-only (hold API keys).
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

-- Inbound webhooks: API keys + request log (admin-only; keys are secrets).
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

-- Simple key/value app settings (e.g. the offices list for the ID-badge form).
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- (Idea voting — one vote per person — is set up at the end of this file:
--  idea_votes + vote_for_idea(). See migrations/0013_security_fixes.sql.)

-- ── Auto-create a profile when a user accepts their invite / signs up ───────
create or replace function public.handle_new_user ()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role_tag, status, started_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role_tag', 'New Starter'),
    'active',
    now()
  )
  on conflict (id) do update set status = 'active', started_at = coalesce(public.profiles.started_at, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.user_badges enable row level security;
alter table public.easter_eggs enable row level security;
alter table public.ideas enable row level security;
alter table public.notifications enable row level security;
drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper: is the current user an admin?
create or replace function public.is_admin ()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Profiles: read your own + admins read all; update your own; admins update all.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Column lockdown (same as migrations/0011): users may update only these
-- columns of their row. is_admin, invited_by, id and email are service-role
-- only. The guard trigger at the end of this file narrows it further.
revoke update on public.profiles from anon, authenticated;
grant update (
  full_name,
  avatar_url,
  role_tag,
  department,
  manager_id,
  journey_points,
  status,
  started_at,
  last_activity_at,
  metadata
) on public.profiles to authenticated;

-- Progress / badges / eggs: owner-only (admins read via service role).
drop policy if exists "progress_owner" on public.progress;
-- Read-only for the owner; the app writes progress/badges/eggs with the
-- service role after its server-side checks (see migrations/0013).
create policy "progress_owner" on public.progress for select
  using (auth.uid() = user_id);
drop policy if exists "badges_owner" on public.user_badges;
create policy "badges_owner" on public.user_badges for select
  using (auth.uid() = user_id);
drop policy if exists "eggs_owner" on public.easter_eggs;
create policy "eggs_owner" on public.easter_eggs for select
  using (auth.uid() = user_id);

-- Integrations: admin-only (contain API keys). Dispatcher reads via service role.
alter table public.integrations enable row level security;
drop policy if exists "integrations_admin" on public.integrations;
create policy "integrations_admin" on public.integrations for all
  using (public.is_admin()) with check (public.is_admin());
alter table public.integration_deliveries enable row level security;
drop policy if exists "deliveries_admin_read" on public.integration_deliveries;
create policy "deliveries_admin_read" on public.integration_deliveries for select
  using (public.is_admin());

alter table public.api_keys enable row level security;
drop policy if exists "api_keys_admin" on public.api_keys;
create policy "api_keys_admin" on public.api_keys for all
  using (public.is_admin()) with check (public.is_admin());
alter table public.inbound_events enable row level security;
drop policy if exists "inbound_admin_read" on public.inbound_events;
create policy "inbound_admin_read" on public.inbound_events for select
  using (public.is_admin());

alter table public.app_settings enable row level security;
drop policy if exists "app_settings_read" on public.app_settings;
create policy "app_settings_read" on public.app_settings for select
  using (auth.role() = 'authenticated');
drop policy if exists "app_settings_write" on public.app_settings;
create policy "app_settings_write" on public.app_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Document signatures: a user manages their own; admins can read all.
alter table public.document_signatures enable row level security;
drop policy if exists "sig_owner" on public.document_signatures;
create policy "sig_owner" on public.document_signatures for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sig_admin_read" on public.document_signatures;
create policy "sig_admin_read" on public.document_signatures for select
  using (public.is_admin());

-- Ideas: everyone signed-in can read; authors can insert; only admins can update.
-- Votes go through vote_for_idea() (security definer), not direct updates.
drop policy if exists "ideas_select" on public.ideas;
create policy "ideas_select" on public.ideas for select using (auth.role() = 'authenticated');
drop policy if exists "ideas_insert" on public.ideas;
create policy "ideas_insert" on public.ideas for insert
  with check (auth.uid() = author_id and votes = 1 and status = 'submitted');
drop policy if exists "ideas_update" on public.ideas;
create policy "ideas_update" on public.ideas for update using (public.is_admin()) with check (public.is_admin());

-- Content tables: any signed-in user can READ; only admins can WRITE.
-- (The cron/invite paths use the service-role key, which bypasses RLS.)
do $$
declare t text;
begin
  foreach t in array array['modules','directors','managers','benefits','badges','pets','locations','company_values','email_templates','documents']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format('create policy "%s_read" on public.%I for select using (auth.role() = ''authenticated'')', t, t);
    execute format('drop policy if exists "%s_write" on public.%I', t, t);
    execute format('create policy "%s_write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- ── Digital recruitment (see migrations/0012_digital_recruitment.sql) ───────
create table if not exists public.candidate_records (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  record jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_references (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,                       -- employer | care_education | personal
  referee_name text,
  referee_email text,
  referee_phone text,
  organisation text,
  referee_position text,
  candidate_role text,
  relationship text,
  start_month text,
  end_month text,
  status text not null default 'draft',     -- draft | requested | received
  token text not null unique,               -- secret for the referee's online form
  requested_at timestamptz,
  last_sent_at timestamptz,
  reminder_count integer not null default 0,
  received_at timestamptz,
  response jsonb,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists candidate_references_user_idx on public.candidate_references (user_id);
create index if not exists candidate_references_status_idx on public.candidate_references (status);

grant select on public.candidate_records to authenticated;
-- Column-level read access: the referee-form `token` (the only credential for
-- submitting a reference) and the referee's `response` are never readable by
-- signed-in users — not even the candidate — so nobody can complete or read
-- their own references. The app reads those with the service role, for admins.
revoke select on public.candidate_references from authenticated;
grant select (
  id, user_id, kind, referee_name, referee_email, referee_phone, organisation,
  referee_position, candidate_role, relationship, start_month, end_month,
  status, requested_at, last_sent_at, reminder_count, received_at, last_error,
  created_at
) on public.candidate_references to authenticated;
grant select, insert, update, delete on public.candidate_records to service_role;
grant select, insert, update, delete on public.candidate_references to service_role;

alter table public.candidate_records enable row level security;
drop policy if exists "candidate_records_read" on public.candidate_records;
create policy "candidate_records_read" on public.candidate_records for select
  using (auth.uid() = user_id or public.is_admin());

alter table public.candidate_references enable row level security;
drop policy if exists "candidate_references_read" on public.candidate_references;
create policy "candidate_references_read" on public.candidate_references for select
  using (auth.uid() = user_id or public.is_admin());

-- ── Videos from staff & service users, and testimonials ────────────────────
create table if not exists public.staff_videos (
  id text primary key,
  title text not null,
  speaker text,
  category text,
  description text,
  video_url text,
  poster_url text,
  "order" integer default 0
);

create table if not exists public.testimonials (
  id text primary key,
  name text not null,
  role text,
  quote text,
  photo_url text,
  "order" integer default 0
);

grant select, insert, update, delete on public.staff_videos to authenticated, service_role;
grant select, insert, update, delete on public.testimonials to authenticated, service_role;

do $$
declare t text;
begin
  foreach t in array array['staff_videos','testimonials']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format('create policy "%s_read" on public.%I for select using (auth.role() = ''authenticated'')', t, t);
    execute format('drop policy if exists "%s_write" on public.%I', t, t);
    execute format('create policy "%s_write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- ════ Security fixes (Strix, Nov 2026) — mirrors migrations/0013 ════
-- ── 1. Per-user vote deduplication ─────────────────────────────────────────
create table if not exists public.idea_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (user_id, idea_id)
);

alter table public.idea_votes enable row level security;

-- Starters can see their own votes; all writes go through vote_for_idea().
drop policy if exists "idea_votes_select_own" on public.idea_votes;
create policy "idea_votes_select_own" on public.idea_votes
  for select using (auth.uid() = user_id);

grant select on public.idea_votes to authenticated;
grant select, insert, update, delete on public.idea_votes to service_role;

create or replace function public.vote_for_idea (p_idea_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  -- Unknown idea, or your own idea (its starting vote is already yours).
  if not exists (
    select 1 from public.ideas where id = p_idea_id and author_id <> v_user
  ) then
    return false;
  end if;

  insert into public.idea_votes (user_id, idea_id)
  values (v_user, p_idea_id)
  on conflict (user_id, idea_id) do nothing;

  if not found then
    return false; -- already voted
  end if;

  update public.ideas set votes = votes + 1 where id = p_idea_id;
  return true;
end;
$$;

revoke all on function public.vote_for_idea (uuid) from public, anon;
grant execute on function public.vote_for_idea (uuid) to authenticated, service_role;

drop function if exists public.increment_idea_votes (uuid);

-- ── 3. Signatures must reference an existing document ──────────────────────
create or replace function public.check_signature_document ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from public.documents where id = new.document_id) then
    raise exception 'Unknown document %', new.document_id using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists document_signatures_check_document on public.document_signatures;
create trigger document_signatures_check_document
  before insert or update of document_id on public.document_signatures
  for each row execute function public.check_signature_document ();

-- ── 5. Progress, badges and eggs: read-only for the owner ──────────────────
revoke insert, update, delete on public.progress from anon, authenticated;
revoke insert, update, delete on public.user_badges from anon, authenticated;
revoke insert, update, delete on public.easter_eggs from anon, authenticated;

-- ── 6. Starters can't edit their own XP, avatar, status, start or manager ──
create or replace function public.guard_profile_self_update ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No end-user JWT (service role / SQL editor) or an admin: allowed.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.journey_points is distinct from old.journey_points
     or new.avatar_url is distinct from old.avatar_url
     or new.status is distinct from old.status
     or new.started_at is distinct from old.started_at
     or new.manager_id is distinct from old.manager_id
     -- Identity and admin rights: also locked by 0011's column grants, kept
     -- here too so a database that missed 0011 is still safe.
     or new.is_admin is distinct from old.is_admin
     or new.invited_by is distinct from old.invited_by
     or new.email is distinct from old.email
     or new.id is distinct from old.id then
    raise exception 'That profile field can only be changed by the app or an admin'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update on public.profiles;
create trigger profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.guard_profile_self_update ();
