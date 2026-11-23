-- 0013 — Strix security fixes (Nov 2026)
--
-- 1. BIG Idea votes: one vote per person per idea.
--    Votes are recorded in idea_votes and counted by vote_for_idea(), which
--    takes the voter from auth.uid() (never from the caller), so the counter
--    can't be stuffed. The old increment_idea_votes() could be called by any
--    signed-in user directly through the API, so it is removed.
-- 2. Ideas can no longer be edited by every signed-in user — only admins.
--    (The app never updates ideas from a starter's session.)
-- 3. A signature must point at a real document. Enforced with a trigger on
--    insert/update so existing signatures and document deletes are unaffected.
-- 4. New ideas must start at 1 vote / 'submitted' (no forged counts on insert),
--    and authors can't add a second vote to their own idea.
-- 5. Journey progress, badges and easter eggs are read-only for a starter's
--    own login. The app writes them with the service-role key after its
--    server-side checks (locked modules, real egg IDs, no repeat XP).
-- 6. A starter can't change their own XP, avatar, name, badge details,
--    status, start date, manager, role, department, admin flag or identity through the API; the app (service role)
--    and admins can. The self-update policy also gains a WITH CHECK.
-- 7. Ideas can only be inserted by the server (author name/photo come from
--    the author's profile, so no impersonation or outside images).
-- 8. Drawn signatures must be the signature pad's PNG data URL.
--
-- Safe to run more than once.

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

-- ── 2. Only admins may update ideas ────────────────────────────────────────
drop policy if exists "ideas_update" on public.ideas;
create policy "ideas_update" on public.ideas
  for update using (public.is_admin()) with check (public.is_admin());

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

-- ── 4. Ideas start at one vote ─────────────────────────────────────────────
drop policy if exists "ideas_insert" on public.ideas;
create policy "ideas_insert" on public.ideas
  for insert with check (
    auth.uid() = author_id and votes = 1 and status = 'submitted'
  );

-- ── 5. Progress, badges and eggs: read-only for the owner ──────────────────
drop policy if exists "progress_owner" on public.progress;
create policy "progress_owner" on public.progress
  for select using (auth.uid() = user_id);
drop policy if exists "badges_owner" on public.user_badges;
create policy "badges_owner" on public.user_badges
  for select using (auth.uid() = user_id);
drop policy if exists "eggs_owner" on public.easter_eggs;
create policy "eggs_owner" on public.easter_eggs
  for select using (auth.uid() = user_id);

revoke insert, update, delete on public.progress from anon, authenticated;
revoke insert, update, delete on public.user_badges from anon, authenticated;
revoke insert, update, delete on public.easter_eggs from anon, authenticated;

-- ── 6. Starters can't edit their own profile fields except last activity
--       (admins and the service role can) ───────────────────────────────────
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
     or new.role_tag is distinct from old.role_tag
     or new.department is distinct from old.department
     -- Shown to other staff (leaderboard, ideas, ID badge): server/admin only.
     or new.full_name is distinct from old.full_name
     or new.metadata is distinct from old.metadata
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

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop trigger if exists profiles_guard_self_update on public.profiles;
create trigger profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.guard_profile_self_update ();

-- ── 7. Ideas are written by the server only ────────────────────────────────
-- The app inserts ideas with the service role, copying the author's name and
-- photo from their profile, so ideas can't be posted under someone else's
-- name or with an outside image. The constrained insert policy stays as a
-- backstop.
revoke insert, update, delete on public.ideas from anon, authenticated;

-- ── 8. Signatures are the signature pad's PNG ──────────────────────────────
-- NOT VALID: checks new and changed rows only; existing signatures are kept.
alter table public.document_signatures
  drop constraint if exists document_signatures_signature_png;
alter table public.document_signatures
  add constraint document_signatures_signature_png check (
    signature_data is null
    or signature_data ~ '^data:image/png;base64,[A-Za-z0-9+/]+={0,2}$'
  ) not valid;
