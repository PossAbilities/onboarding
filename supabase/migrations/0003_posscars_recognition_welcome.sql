-- ============================================================================
--  Migration: PossCars + Positive Recognition + closing Welcome video
--  Adds an optional per-mission icon, removes stray blank modules, and inserts
--  three new missions before the Certificate. Idempotent.
-- ============================================================================

alter table public.modules add column if not exists icon text;

-- Remove any blank "Add Mission" leftovers.
delete from public.modules where id like 'm-custom-%';

do $$
begin
  if not exists (select 1 from public.modules where id = 'm-posscars') then
    -- Shift the Certificate (and anything at/after order 10) down by 3.
    update public.modules set "order" = "order" + 3, level = level + 3 where "order" >= 10;

    insert into public.modules
      (id, slug, "order", level, kind, icon, title, short_title, description, est_minutes, required, badge_id, reward_xp, hero_media_url, hero_poster, content)
    values
      ('m-posscars','posscars',10,10,'content','emoji_events','Mission 10: The PossCars','The PossCars',
       'Our very own staff awards! Once a year we roll out the (purple) carpet to celebrate the people who go above and beyond.',
       5,false,null,60,null,'https://picsum.photos/seed/posscars-hero/1200/675',
       '[{"type":"heading","text":"And the award goes to... you, one day!"},
         {"type":"paragraph","text":"The PossCars are our annual celebration of brilliance. Every team member can be nominated by colleagues across categories that reflect our values."},
         {"type":"gallery","images":["https://picsum.photos/seed/posscars-1/800/800","https://picsum.photos/seed/posscars-2/800/800","https://picsum.photos/seed/posscars-3/800/800","https://picsum.photos/seed/posscars-4/800/800","https://picsum.photos/seed/posscars-5/800/800","https://picsum.photos/seed/posscars-6/800/800"]},
         {"type":"list","items":["A glamorous awards evening with the whole organisation","Nominate colleagues who have made a real difference","Winners receive a trophy, a prize, and a lot of well-earned applause","Every nominee is celebrated"]},
         {"type":"callout","text":"Keep an eye out for nomination season."}]'::jsonb),

      ('m-recognition','positive-recognition',11,11,'content','volunteer_activism','Mission 11: Positive Recognition','Positive Recognition',
       'Recognition is not just for awards night. Discover how we say thank you and celebrate each other every single day.',
       4,false,null,60,null,'https://picsum.photos/seed/recognition-hero/1200/675',
       '[{"type":"heading","text":"A culture of thank you"},
         {"type":"paragraph","text":"Our Positive Recognition service makes it easy for anyone to recognise a colleague for living our values."},
         {"type":"list","items":["Send a colleague a recognition shout-out at any time","Recognitions are shared with their manager and celebrated team-wide","Collect recognitions towards rewards and PossCars nominations","Managers use recognitions in supervisions to celebrate great work"]},
         {"type":"quote","text":"Feeling genuinely appreciated for the work you do changes everything.","author":"PossAbilities People Team"}]'::jsonb),

      ('m-welcome-close','welcome-to-possabilities',12,12,'content','celebration','Mission 12: Welcome to PossAbilities','Welcome to the Family',
       'You have made it! One last video to officially welcome you to the PossAbilities family.',
       3,true,null,100,'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4','https://picsum.photos/seed/welcome-close-hero/1200/675',
       '[{"type":"heading","text":"Welcome to PossAbilities!"},
         {"type":"paragraph","text":"That is your induction journey complete. Press play for a warm welcome from the whole team, then head to the summit to sign your documents and collect your certificate."}]'::jsonb);
  end if;
end $$;
