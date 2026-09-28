-- ============================================================================
--  Migration: digital recruitment process
--  Candidate records (personal details, offer letter, onboarding tasks and
--  the HR checklist), referee requests, and the Videos / Testimonials pages.
--
--  Candidate data is sensitive (DOB, NI number, right-to-work details), so:
--   • candidates can READ only their own rows; admins can read all;
--   • nobody writes through the public API — every write goes through the
--     app's server actions using the service-role key, after the app has
--     checked who is allowed to make that change.
-- ============================================================================

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
grant select on public.candidate_references to authenticated;
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

insert into public.staff_videos (id, title, speaker, category, description, video_url, poster_url, "order") values
  ('vid-support-worker','A day in the life of a Support Worker','Jess, Support Worker','Staff','Jess shares what a typical shift looks like and what she loves about the role.','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4','',1),
  ('vid-team-leader','Why I stayed at PossAbilities','Marcus, Team Leader','Staff','Marcus started as a support worker and now leads his own team.','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4','',2),
  ('vid-service-user','Living the life I choose','Tom, supported by PossAbilities','People we support','Tom talks about his home, his hobbies and the team who support him.','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4','',3)
on conflict (id) do nothing;

insert into public.testimonials (id, name, role, quote, photo_url, "order") values
  ('tst-1','Sophie','Support Worker, Supported Living','From my very first day I felt part of a family. The training was brilliant and there''s always someone to ask.','https://i.pravatar.cc/300?img=45',1),
  ('tst-2','Daniel','Day Services Coordinator','No two days are the same. Seeing the people we support achieve their goals is the best feeling in the world.','https://i.pravatar.cc/300?img=52',2),
  ('tst-3','Margaret','Parent of someone we support','The team treat my son with such kindness and respect. He''s more confident and independent than ever.','https://i.pravatar.cc/300?img=47',3)
on conflict (id) do nothing;
