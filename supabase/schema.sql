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

-- ── Vote increment helper ───────────────────────────────────────────────────
create or replace function public.increment_idea_votes (idea_id uuid)
returns void language sql as $$
  update public.ideas set votes = votes + 1 where id = idea_id;
$$;

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
  using (auth.uid() = id or public.is_admin());

-- Progress / badges / eggs: owner-only (admins read via service role).
drop policy if exists "progress_owner" on public.progress;
create policy "progress_owner" on public.progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "badges_owner" on public.user_badges;
create policy "badges_owner" on public.user_badges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "eggs_owner" on public.easter_eggs;
create policy "eggs_owner" on public.easter_eggs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Document signatures: a user manages their own; admins can read all.
alter table public.document_signatures enable row level security;
drop policy if exists "sig_owner" on public.document_signatures;
create policy "sig_owner" on public.document_signatures for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sig_admin_read" on public.document_signatures;
create policy "sig_admin_read" on public.document_signatures for select
  using (public.is_admin());

-- Ideas: everyone signed-in can read; authors can insert; anyone can vote (update votes).
drop policy if exists "ideas_select" on public.ideas;
create policy "ideas_select" on public.ideas for select using (auth.role() = 'authenticated');
drop policy if exists "ideas_insert" on public.ideas;
create policy "ideas_insert" on public.ideas for insert with check (auth.uid() = author_id);
drop policy if exists "ideas_update" on public.ideas;
create policy "ideas_update" on public.ideas for update using (auth.role() = 'authenticated');

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
