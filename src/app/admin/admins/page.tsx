import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdmins, getRoles } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { AdminTable, InviteAdminForm, type AdminRow } from "./AdminUsers";

export const metadata: Metadata = { title: "Admin · Admin Users" };

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const [admins, roles] = await Promise.all([getAdmins(), getRoles()]);

  const rows: AdminRow[] = admins.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    roleTag: a.roleTag,
    avatarUrl: a.avatarUrl,
    status: a.status,
    isSelf: a.id === me.id,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black text-on-surface">Admin Users</h1>
      <p className="mt-1 text-on-surface-variant">
        Who can access this dashboard, invite starters, and edit journey content.
      </p>

      <div className="mt-6">
        <InviteAdminForm roles={roles} />
      </div>

      <AdminTable admins={rows} />

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
        <Icon name="shield" size={18} className="mt-0.5 shrink-0" />
        Admins can see every starter&rsquo;s progress and personal details. Removing
        access keeps their account — it only takes away the dashboard. You
        can&rsquo;t remove your own access or the last remaining admin.
      </p>
    </div>
  );
}
