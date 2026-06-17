-- ============================================================================
--  PossAbilities Onboarding — seed content
--  Run AFTER schema.sql. Mirrors src/lib/seed.ts so the database matches the
--  out-of-the-box demo content. Re-runnable (upserts).
-- ============================================================================

insert into public.badges (id, name, description, icon, xp, criteria) values
  ('first-contact','First Contact','Watched the Welcome video from our CEO.','verified',50,'Complete the Welcome module'),
  ('culture-champion','Culture Champion','Completed all of the culture & values modules.','diversity_3',150,'Complete Culture & Values'),
  ('the-pioneer','The Pioneer','Submitted your first BIG Idea.','lightbulb',100,'Submit an idea to the BIG Idea portal'),
  ('navigator','Navigator','Found all 3 hidden Easter eggs across the journey.','explore',120,'Find 3 Easter eggs'),
  ('people-person','People Person','Met all of the directors.','groups',80,'Complete Meet the Directors'),
  ('summit','Summit','Completed the entire induction journey.','emoji_events',300,'Reach 100% completion')
on conflict (id) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, xp = excluded.xp, criteria = excluded.criteria;

insert into public.modules (id, slug, "order", level, kind, title, short_title, description, est_minutes, required, badge_id, reward_xp, hero_media_url, hero_poster) values
  ('m-welcome','welcome',1,1,'video','Mission 01: The Welcome','Welcome Home','A message from our leadership about our mission and the road ahead.',5,true,'first-contact',50,'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4','https://picsum.photos/seed/welcome-hero/1200/675'),
  ('m-culture','culture',2,2,'culture','Mission 02: Our Culture & Values','Our Culture','Step into the heart of PossAbilities.',12,true,'culture-champion',150,'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4','https://picsum.photos/seed/culture-hero/1200/675'),
  ('m-benefits','benefits',3,3,'benefits','Mission 03: Your Life, Your Perks','Benefits','We believe that when you thrive, we thrive.',8,true,null,90,null,'https://picsum.photos/seed/benefits-hero/1200/675'),
  ('m-bigidea','big-idea',4,4,'bigidea','Mission 04: The BIG Idea Portal','The BIG Idea','Got a better way to do things? We want to hear it!',6,false,'the-pioneer',100,null,'https://picsum.photos/seed/bigidea-hero/1200/675'),
  ('m-pets','very-important-pets',5,5,'pets','Mission 05: Very Important Pets','V.I.P. Wellbeing','Our furry teammates are a huge part of our culture.',4,false,null,60,null,'https://picsum.photos/seed/pets-hero/1200/675'),
  ('m-locations','locations',6,6,'locations','Mission 06: Locations & Services','Locations','Explore where we work and the services we deliver.',5,false,null,60,null,'https://picsum.photos/seed/locations-hero/1200/675'),
  ('m-certificate','certificate',7,7,'certificate','Mission 07: Reach the Summit','Certificate','Finalise your induction and download your certificate.',3,true,'summit',300,null,'https://picsum.photos/seed/summit-hero/1200/675')
on conflict (id) do update set title = excluded.title, description = excluded.description, hero_media_url = excluded.hero_media_url, hero_poster = excluded.hero_poster;

insert into public.directors (id, name, role, bio, photo_url, "order") values
  ('d-sarah','Sarah Chen','Chief Executive Officer','Sarah leads our mission to push back the boundaries of person-centred care.','https://i.pravatar.cc/300?img=47',1),
  ('d-marcus','Marcus Thorne','Director of Operations','Our mission is to streamline brilliance for our frontline teams.','https://i.pravatar.cc/300?img=12',2),
  ('d-elena','Elena Rodriguez','Director of People & Culture','You aren''t just an employee, you''re a part of our ecosystem.','https://i.pravatar.cc/300?img=45',3),
  ('d-david','David Park','Director of Innovation','Never stop asking ''what if?''.','https://i.pravatar.cc/300?img=33',4)
on conflict (id) do update set name = excluded.name, role = excluded.role, bio = excluded.bio, photo_url = excluded.photo_url;

insert into public.benefits (id, category, title, description, icon, "order", highlight) values
  ('b-pay','Growth & Lifestyle','Competitive Pay & Pension','A salary that recognises your value, paired with a leading pension contribution scheme.','payments',1,false),
  ('b-wellbeing','Health & Wellbeing','Flexible Working','Work-life balance is not just a buzzword here.','self_improvement',2,false),
  ('b-eap','Health & Wellbeing','Employee Assistance','24/7 confidential support for mental health, legal advice, and personal financial guidance.','health_and_safety',3,false),
  ('b-learning','Growth & Lifestyle','Learning & Development Fund','Every employee gets a personal budget for professional courses and conferences.','school',4,false),
  ('b-retail','Growth & Lifestyle','Retail & Leisure Discounts','Save on the things you love — from your weekly shop to gym memberships and days out.','redeem',5,true),
  ('b-bigidea','Growth & Lifestyle','The BIG Idea Reward','Pitch a better way to do things and earn rewards up to £500 if implemented.','emoji_objects',6,false)
on conflict (id) do update set title = excluded.title, description = excluded.description, icon = excluded.icon;

insert into public.pets (id, name, species, owner, photo_url, fun_fact) values
  ('p-1','Biscuit','Office Labrador','with Elena','https://picsum.photos/seed/pet-biscuit/600/600','Chief Morale Officer. Will trade a paw for a belly rub.'),
  ('p-2','Mochi','Therapy Cat','with the Wellbeing team','https://picsum.photos/seed/pet-mochi/600/600','Naps through every meeting and somehow still gets promoted.'),
  ('p-3','Pickle','Reception Parrot','with Front of House','https://picsum.photos/seed/pet-pickle/600/600','Greets everyone with ''Live the life you choose!'''),
  ('p-4','Nugget','Garden Tortoise','with Facilities','https://picsum.photos/seed/pet-nugget/600/600','Slow and steady — our unofficial mascot for patience.')
on conflict (id) do update set name = excluded.name, fun_fact = excluded.fun_fact;

insert into public.locations (id, name, region, description, image_url, services) values
  ('loc-1','The Hub — Rochdale','Greater Manchester','Our flagship community centre and head office.','https://picsum.photos/seed/loc-rochdale/800/500','{"Day Services","Head Office","Training Suite"}'),
  ('loc-2','Heywood Supported Living','Greater Manchester','Person-centred supported living homes.','https://picsum.photos/seed/loc-heywood/800/500','{"Supported Living","Outreach"}'),
  ('loc-3','Middleton Wellbeing Garden','Greater Manchester','A green space for horticulture therapy and our Very Important Pets.','https://picsum.photos/seed/loc-middleton/800/500','{"Horticulture","Wellbeing","Community"}'),
  ('loc-4','Bury Enterprise Café','Greater Manchester','A social enterprise café offering employment and training.','https://picsum.photos/seed/loc-bury/800/500','{"Enterprise","Employment","Café"}')
on conflict (id) do update set name = excluded.name, description = excluded.description;

insert into public.ideas (author_name, author_avatar, title, description, category, status, votes) values
  ('James Miller','https://i.pravatar.cc/300?img=15','Automated Inventory Restocking via AI','Use computer vision to track stock levels and auto-order essentials.','Operations','implemented',3248),
  ('Sarah Jenkins','https://i.pravatar.cc/300?img=48','Paperless Onboarding Flow','Digitise all HR contracts and safety modules for new starters.','People','popular',3199),
  ('Ananya Sharma','https://i.pravatar.cc/300?img=44','Sustainable Packaging Initiative','Replace plastic fillers with biodegradable alternatives.','Sustainability','reviewing',1438)
on conflict do nothing;
