-- ============================================================================
--  Migration: in-app notifications
-- ============================================================================

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

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

grant select, insert, update, delete on public.notifications to authenticated, service_role;

alter table public.notifications enable row level security;
drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed a couple for the current admin so the bell shows content.
insert into public.notifications (user_id, title, body, icon, href, read)
select id, 'Welcome to PossAbilities! 💜', 'Your dashboard is ready. Explore the journey and admin tools.', 'celebration', '/journey', false
from public.profiles where email = 'digital@possabilities.org.uk'
on conflict do nothing;

insert into public.notifications (user_id, title, body, icon, href, read)
select id, 'Tip: invite your first starter', 'Head to Manage Starters to send an invite.', 'group_add', '/admin/starters', false
from public.profiles where email = 'digital@possabilities.org.uk'
on conflict do nothing;
