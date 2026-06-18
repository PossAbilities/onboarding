-- ============================================================================
--  Migration: secure credential vault (encrypted at rest, owner-only)
--  Secrets are encrypted in the APP with CREDENTIALS_KEY (AES-256-GCM) before
--  being stored here, so the database never holds plaintext passwords.
-- ============================================================================

create table if not exists public.user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  username text,
  secret_enc text,          -- app-encrypted (iv.tag.ciphertext)
  url text,
  notes text,
  expires_at timestamptz,   -- 30 days after the starter's start date
  created_at timestamptz not null default now()
);

create index if not exists user_credentials_user_idx on public.user_credentials (user_id);
create index if not exists user_credentials_expiry_idx on public.user_credentials (expires_at);

grant select, insert, update, delete on public.user_credentials to authenticated, service_role;

alter table public.user_credentials enable row level security;
-- Owner-only: nobody (not even admins) can read another person's logins via RLS.
drop policy if exists "credentials_owner" on public.user_credentials;
create policy "credentials_owner" on public.user_credentials for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
