-- ============================================================================
--  Migration: "Your Photo" step
--  Inserts the photo-upload mission at order 2, shifting later missions down
--  once, without disturbing existing content. Idempotent.
-- ============================================================================

do $$
begin
  if not exists (select 1 from public.modules where id = 'm-photo') then
    update public.modules set "order" = "order" + 1, level = level + 1 where "order" >= 2;
    insert into public.modules
      (id, slug, "order", level, kind, title, short_title, description, est_minutes, required, badge_id, reward_xp, hero_media_url, hero_poster)
    values
      ('m-photo','your-photo',2,2,'photo','Mission 02: Your Photo','Your Photo',
       'Let''s put a face to the name. Add a passport-style headshot — it''ll be used on your staff profile and your ID badge.',
       3,true,null,50,null,null);
  end if;
end $$;
