-- Admin users management: close the self-promotion hole on public.profiles.
--
-- `profiles_update_self` intentionally lets a user update their own row (avatar,
-- journey points, badge metadata). But `is_admin` lives on that same row, so a
-- signed-in starter could previously PATCH their own profile through the anon
-- REST API and grant themselves the admin dashboard.
--
-- RLS can't express "any column except this one", so we use column-level
-- privileges instead. Note that revoking UPDATE(col) is a no-op while a
-- table-wide UPDATE grant exists, so the table grant must be dropped first and
-- the safe columns granted back explicitly.
--
-- `is_admin` and `invited_by` are now writable only by the service-role client
-- (used by inviteAdmin()/revokeAdmin()), which bypasses RLS and column grants.
-- `id` and `email` are likewise frozen — identity, not user-editable data.

revoke update on public.profiles from anon, authenticated;

grant update (
  full_name,
  avatar_url,
  role_tag,
  department,
  manager_id,
  journey_points,
  status,
  started_at,
  last_activity_at,
  metadata
) on public.profiles to authenticated;
