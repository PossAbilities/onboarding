import type { Metadata } from "next";
import { getStarters } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { InviteStarterForm, BulkImportForm } from "./InviteForms";

export const metadata: Metadata = { title: "Admin · Manage Starters" };

export default async function ManageStartersPage() {
  const starters = await getStarters();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black text-on-surface">Manage Starters</h1>
      <p className="mt-1 text-on-surface-variant">
        Invite new team members and track their induction progress.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <InviteStarterForm />
        <BulkImportForm />
      </div>

      {/* Starter table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest journey-card-shadow">
        <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4">
          <h2 className="text-lg font-black text-on-surface">
            All Starters{" "}
            <span className="text-on-surface-variant">({starters.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {starters.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={s.avatarUrl} name={s.fullName} size={36} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">
                          {s.fullName}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {s.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Chip tone="purple">{s.roleTag}</Chip>
                  </td>
                  <td className="px-5 py-3">
                    <ProgressBar
                      value={Math.min(100, Math.round((s.journeyPoints / 1500) * 100))}
                      showLabel
                      className="w-36"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Chip
                      tone={
                        s.status === "completed"
                          ? "success"
                          : s.status === "invited"
                            ? "locked"
                            : "teal"
                      }
                    >
                      {s.status}
                    </Chip>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-secondary">
                      <Icon name="bolt" size={16} fill /> {s.journeyPoints}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
