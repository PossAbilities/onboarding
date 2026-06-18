# PossAbilities — New Starter Induction Journey

A gamified onboarding website for PossAbilities CIC new starters. New employees
are invited by an admin, sign in, and progress through a "mission path" of
modules — a welcome video, meeting the directors, culture & values (with a
mini-game), benefits, the BIG Idea innovation portal, Very Important Pets &
wellbeing, locations, and a downloadable completion certificate — earning XP and
badges along the way. Admins invite starters, track progress, edit content, and
view analytics.

Built with **Next.js 16** (App Router) · **Tailwind CSS v4** · **Supabase**
(Auth + Postgres + Storage) · deploys to **Netlify**. Brand and visual system
follow the **PossAbilities Brand Manual 1.1** and the Stitch "Gamified Journey"
design (`DESIGN.md`): purple / pink / blue-green, Montserrat, "squishy" 3D
buttons, and a progress-path motif.

> **Live the life you choose.**

---

## ✨ Two modes

The app runs out-of-the-box with **no backend** so you can click through
everything immediately:

| | Demo mode (default) | Connected mode |
|---|---|---|
| Trigger | No Supabase env vars | Supabase env vars set |
| Login | One-click "New Starter" / "Admin" buttons | Real email + password |
| Data | Seeded, in-memory (resets on restart) | Persisted in Postgres |
| Invites | Added to the in-memory list | Emailed via Supabase Auth |
| Video | Sample CDN clips | Your uploads (Supabase Storage) |

Everything (games, certificate, content editor, invites, analytics) works in
demo mode; it simply doesn't persist between server restarts.

---

## 🚀 Quick start (local)

```bash
npm install
npm run dev
# open http://localhost:3000  →  click "Enter as a New Starter" or "Enter as an Admin"
```

That's it for the demo. To wire up the real backend, see below.

---

## 🔌 Connect Supabase (real auth, persisted data, invites, video)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Run the SQL.** In the Supabase dashboard → **SQL Editor → New query**, paste
   and run, in order:
   - `supabase/schema.sql` (tables, row-level security, triggers)
   - `supabase/seed.sql` (the same content as the demo)
3. **Add env vars.** Copy `.env.example` to `.env.local` and fill in (from
   Supabase → **Project Settings → API**):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, used for admin invites
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. **Create your admin user.** Either sign up through the app, or add a user in
   Supabase → **Authentication → Users**. Then make them an admin:
   ```sql
   update public.profiles set is_admin = true where email = 'you@possabilities.org.uk';
   ```
5. **Restart** `npm run dev`. The login screen now asks for email + password, and
   the admin "Invite a starter" / "Bulk import" buttons send real invite emails.

### Invite emails & redirect
Invites use Supabase's `inviteUserByEmail`, redirecting to `/accept-invite`
where the new starter sets a password. In Supabase → **Authentication → URL
Configuration**, add your site URL (and `…/auth/confirm`) to the allowed redirect
URLs.

### Native video uploads
Create a **Storage bucket** (e.g. `induction-media`, public), upload your
welcome / culture videos, and paste the public URL into a module via
**Admin → Journey Content → Hero media URL**. The site plays them natively with
the built-in HTML5 player (no third-party embeds).

---

## 🌐 Deploy to Netlify

This repo includes `netlify.toml` with the official Next.js runtime.

1. Push this repo to GitHub (see below).
2. In Netlify → **Add new site → Import from GitHub**, pick the repo.
3. Build settings are auto-detected from `netlify.toml`
   (`npm run build`, plugin `@netlify/plugin-nextjs`).
4. **Site settings → Environment variables** — add the four vars from step 3
   above, setting `NEXT_PUBLIC_SITE_URL` to your Netlify URL.
5. Deploy. (Without the Supabase vars it deploys in demo mode — handy for a
   quick shareable preview.)

---

## 🗂 Project structure

```
src/
  app/
    (employee)/            # authed employee area (sidebar + journey shell)
      journey/             # the gamified mission path (home)
      modules/[slug]/      # one route → renders per module "kind"
      badges/ leaderboard/ milestones/ knowledge-hub/
    admin/                 # admin console (requireAdmin)
      page.tsx  starters/  content/  analytics/  settings/
    actions/               # server actions (auth, journey, admin)
    login/  accept-invite/  auth/confirm/
  components/
    ui/                    # Button, Card, Chip, ProgressBar, Avatar, VideoPlayer…
    layout/                # EmployeeShell, AdminShell, nav, user menu
    modules/               # ModuleScaffold + per-kind views + complete/egg
    games/                 # ValuesGame, IdeaPortal
  lib/
    data.ts                # data layer (Supabase OR demo fallback)
    seed.ts                # all demo/seed content (edit copy & media here)
    journey.ts             # unlock + progress logic
    auth.ts  config.ts  demo-store.ts  supabase/
  proxy.ts                 # Next 16 "proxy" (middleware) — route protection
supabase/
  schema.sql  seed.sql     # one-shot backend setup
```

## ✏️ Editing missions (full CMS)
**Admin → Journey Content** is a complete mission builder:
- **Reorder** missions (↑/↓), **add** new missions, and **delete** them.
- Edit every field: title, short title, URL slug, description, **layout type**
  (welcome video / directors / culture+game / benefits / BIG Idea / pets /
  locations / rich-content / certificate), **unlockable badge**, required flag,
  estimated time, reward XP, and **hero media** (paste a `.mp4`/image URL).
- Write **rich body content block by block** — headings, paragraphs, quotes,
  checklists and callouts, each reorderable and removable. These render on the
  mission page via the shared content renderer.
- Changes publish instantly (in-memory in demo mode; persisted to the `modules`
  table in connected mode).

**Admin → Content Library** gives total control of every supporting content
collection — **Directors, Benefits, Pets, Locations and Badges**. Add, edit,
reorder and delete items, and **upload photos** for directors, pets and
locations (or paste a URL). Uploads go to the Supabase Storage `media` bucket
when connected (auto-created, public) or an in-preview data URL in demo mode.

**Admin → Email Templates** is a full HTML email editor: create/edit/delete
templates, insert **system merge-tags** (`{{first_name}}`, `{{journey_name}}`,
`{{progress_percent}}`, `{{next_mission}}`, `{{due_date}}`, `{{login_url}}`, …),
and see a **live preview** (desktop/mobile) rendered with sample data. Ships
with Welcome, Reminder and Completion templates.

> **Sending:** templates are designed and stored here; welcome emails already
> go out via Supabase invites. To send reminder/completion emails on a schedule,
> wire an email provider (e.g. [Resend](https://resend.com)) to `renderTemplate`
> in `src/lib/email.ts` — the merge-tag substitution is already done for you.

Prefer editing in code? `src/lib/seed.ts` holds the starting catalogue
(missions, directors, benefits, pets, locations, badges, values, email
templates) and is the seed for both modes.

## 🧩 Notes & roadmap
- Demo mode stores writes in server memory — great for previews, not durable.
  Connect Supabase for real persistence (missions persist to the `modules`
  table with `content` as JSONB; directors/benefits/pets/locations/badges to
  their own tables; uploaded media to the `media` storage bucket).
- Media uploads use the Supabase **service-role** key server-side, so no extra
  storage RLS policies are required; the `media` bucket is created public for
  reads on first upload.

---
© PossAbilities CIC — Live The Life You Choose.
