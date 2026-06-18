"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { updateStarterAction } from "@/app/actions/admin";
import type { ManagerOption } from "./InviteForms";

export function EditStarter({
  starter,
  managers,
  roles,
  departments,
}: {
  starter: {
    id: string;
    fullName: string;
    roleTag: string;
    department: string | null;
    managerId: string | null;
  };
  managers: ManagerOption[];
  roles: string[];
  departments: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleTag, setRoleTag] = useState(starter.roleTag);
  const [department, setDepartment] = useState(starter.department ?? "");
  const [managerId, setManagerId] = useState(starter.managerId ?? "");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      await updateStarterAction(starter.id, {
        roleTag,
        department: department || null,
        managerId: managerId || null,
      });
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-secondary"
        aria-label={`Edit ${starter.fullName}`}
      >
        <Icon name="edit" size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 journey-card-shadow float-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-on-surface">
                {starter.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Role</span>
                <select
                  value={roleTag}
                  onChange={(e) => setRoleTag(e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5"
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Department</span>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5"
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-on-surface">
                  Assigned manager
                </span>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5"
                >
                  <option value="">— No manager —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.role}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-on-surface-variant">
                  Sets their personalised &ldquo;Meet Your Manager&rdquo; mission.
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="btn-3d rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
