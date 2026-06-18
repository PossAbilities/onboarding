-- ============================================================================
--  Migration: "Meet Your Manager"
--  Adds the managers table + per-starter assignment, and inserts the new
--  Mission 03 without disturbing existing module content. Idempotent.
-- ============================================================================

-- 1. Per-starter assignment columns.
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists manager_id text;

-- 2. Managers table.
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

grant select, insert, update, delete on public.managers to anon, authenticated, service_role;

alter table public.managers enable row level security;
drop policy if exists "managers_read" on public.managers;
create policy "managers_read" on public.managers for select using (auth.role() = 'authenticated');
drop policy if exists "managers_write" on public.managers;
create policy "managers_write" on public.managers for all
  using (public.is_admin()) with check (public.is_admin());

-- 3. Insert the new mission at position 3, shifting later missions down once.
do $$
begin
  if not exists (select 1 from public.modules where id = 'm-manager') then
    update public.modules set "order" = "order" + 1, level = level + 1 where "order" >= 3;
    insert into public.modules
      (id, slug, "order", level, kind, title, short_title, description, est_minutes, required, badge_id, reward_xp, hero_media_url, hero_poster)
    values
      ('m-manager','meet-your-manager',3,3,'manager','Mission 03: Meet Your Manager','Meet Your Manager',
       'Meet the person who''ll have your back day to day. Watch a personal hello from your manager and learn how you''ll work together.',
       5,true,null,80,null,'https://picsum.photos/seed/manager-hero/1200/675');
  end if;
end $$;

-- 4. Seed a few managers (only if not already present).
insert into public.managers (id, name, role, department, bio, photo_url, video_url, "order") values
  ('mgr-priya','Priya Patel','Team Leader','Supported Living','Priya leads the Supported Living team and will be your day-to-day go-to.','https://i.pravatar.cc/300?img=31','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',1),
  ('mgr-daniel','Daniel O''Brien','Service Manager','Day Services','Daniel oversees Day Services with big ideas and an open door.','https://i.pravatar.cc/300?img=14','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',2),
  ('mgr-aisha','Aisha Khan','Registered Manager','Community Outreach','Aisha manages Community Outreach and champions person-centred support.','https://i.pravatar.cc/300?img=25','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',3)
on conflict (id) do nothing;
