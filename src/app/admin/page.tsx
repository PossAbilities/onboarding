import type { Metadata } from "next";
import Link from "next/link";
import { getStarters, getStarterStats } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Admin · Overview" };

export default async function AdminOverviewPage() {
  const [stats, starters] = await Promise.all([
    getStarterStats(),
    getStarters(),
  ]);
  const recent = starters.slice(0, 5);

  const cards = [
    { icon: "groups", label: "Active Starters", value: stats.activeStarters, tone: "pink" as const },
    { icon: "verified", label: "Completion Rate", value: `${stats.completionRate}%`, tone: "teal" as const },
    { icon: "pending_actions", label: "Pending Tasks", value: stats.pendingTasks, tone: "purple" as const },
    { icon: "trending_up", label: "Module Success", value: `${stats.moduleSuccess}%`, tone: "pink" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">
            New Starter Management
          </h1>
          <p className="mt-1 text-on-surface-variant">
            Oversee onboarding progress and manage induction journeys.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/starters" variant="primary">
            <Icon name="person_add" size={20} /> Add New Starter
          </ButtonLink>
          <ButtonLink href="/admin/starters#bulk" variant="outline">
            <Icon name="upload" size={20} /> Bulk Import
          </ButtonLink>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow"
          >
            <Chip tone={c.tone} icon={<Icon name={c.icon} size={16} fill />}>
              {c.label}
            </Chip>
            <p className="mt-3 text-3xl font-black text-on-surface">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent starters */}
      <div className="mt-8 rounded-xl border border-outline-variant/50 bg-surface-container-lowest journey-card-shadow">
        <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4">
          <h2 className="text-lg font-black text-on-surface">Active Starters</h2>
          <Link
            href="/admin/starters"
            className="text-sm font-bold text-secondary hover:underline"
          >
            View all →
          </Link>
        </div>
        <ul className="divide-y divide-outline-variant/40">
          {recent.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar src={s.avatarUrl} name={s.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-on-surface">{s.fullName}</p>
                <p className="truncate text-xs text-on-surface-variant">{s.email}</p>
              </div>
              <div className="hidden w-40 sm:block">
                <ProgressBar
                  value={Math.min(100, Math.round((s.journeyPoints / 1500) * 100))}
                  showLabel
                />
              </div>
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
