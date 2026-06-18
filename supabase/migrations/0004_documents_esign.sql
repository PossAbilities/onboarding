-- ============================================================================
--  Migration: native document e-signing
-- ============================================================================

create table if not exists public.documents (
  id text primary key,
  title text not null,
  description text,
  body text,
  file_url text,
  required boolean default true,
  "order" integer default 0
);

create table if not exists public.document_signatures (
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id text not null,
  signed_name text,
  signature_data text,
  signed_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

grant select, insert, update, delete on public.documents to anon, authenticated, service_role;
grant select, insert, update, delete on public.document_signatures to authenticated, service_role;

-- RLS: documents — authed read, admin write.
alter table public.documents enable row level security;
drop policy if exists "documents_read" on public.documents;
create policy "documents_read" on public.documents for select using (auth.role() = 'authenticated');
drop policy if exists "documents_write" on public.documents;
create policy "documents_write" on public.documents for all
  using (public.is_admin()) with check (public.is_admin());

-- RLS: signatures — owner manages own, admins read all.
alter table public.document_signatures enable row level security;
drop policy if exists "sig_owner" on public.document_signatures;
create policy "sig_owner" on public.document_signatures for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sig_admin_read" on public.document_signatures;
create policy "sig_admin_read" on public.document_signatures for select
  using (public.is_admin());

-- Seed three starter documents.
insert into public.documents (id, title, description, body, required, "order") values
  ('doc-handbook','Employee Handbook Acknowledgement','Confirm you have read and understood the PossAbilities Employee Handbook.','<p>I confirm that I have received, read and understood the PossAbilities Employee Handbook, including the policies on conduct, safeguarding, health &amp; safety, and equality &amp; diversity.</p><p>I understand it is my responsibility to ask my manager if anything is unclear, and to comply with these policies throughout my employment.</p>',true,1),
  ('doc-contract','Statement of Terms (Contract)','Review and sign your statement of main terms of employment.','<p>This document sets out the main terms of your employment with PossAbilities CIC, including your role, hours, pay, holiday entitlement and notice periods.</p><p>By signing, you confirm the details are correct and you accept the terms as described.</p>',true,2),
  ('doc-it','IT &amp; Acceptable Use Policy','Agree to our acceptable use policy for IT systems and data.','<p>I agree to use PossAbilities IT systems, devices and data responsibly and in line with the Acceptable Use and Data Protection policies, keeping the people we support and their information safe and confidential.</p>',true,3)
on conflict (id) do nothing;
