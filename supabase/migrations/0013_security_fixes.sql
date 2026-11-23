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
