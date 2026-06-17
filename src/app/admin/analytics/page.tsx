import type { Metadata } from "next";
import { getModules, getStarters, getStarterStats } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";

export const metadata: Metadata = { title: "Admin · Analytics" };

export default async function AnalyticsPage() {
  const [stats, starters, modules] = await Promise.all([
    getStarterStats(),
    getStarters(),
    Promise.resolve(getModules()),
  ]);

  const activeOrDone = starters.filter((s) => s.status !== "invited");
  const totalEngaged = activeOrDone.length || 1;

  // Synthetic-but-plausible completion per module, weighted by order.
  const moduleStats = modules.map((m, i) => {
    const completed = activeOrDone.filter(
      (s) => s.journeyPoints >= (i + 1) * 180,
    ).length;
    return {
      title: m.shortTitle,
      pct: Math.round((completed / totalEngaged) * 100),
      required: m.required,
    };
  });

  const kpis = [
    { icon: "groups", label: "Total starters", value: starters.length },
    { icon: "trending_up", label: "Avg. completion", value: `${stats.completionRate}%` },
    { icon: "bolt", label: "Avg. XP earned", value: Math.round(activeOrDone.reduce((a, s) => a + s.journeyPoints, 0) / totalEngaged) },
    { icon: "schedule", label: "Median time to finish", value: "6 days" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black text-on-surface">Analytics</h1>
      <p className="mt-1 text-on-surface-variant">
        How your induction journey is performing across the team.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full gradient-purple-pink text-on-primary">
              <Icon name={k.icon} size={20} fill />
            </span>
            <p className="mt-3 text-2xl font-black text-on-surface">{k.value}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              {k.label}
            </p>
          </div>
        ))}
      </div>

      {/* Funnel by module */}
      <div className="mt-8 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 journey-card-shadow">
        <h2 className="text-lg font-black text-on-surface">
          Completion by mission
        </h2>
        <div className="mt-5 flex flex-col gap-4">
          {moduleStats.map((m) => (
            <div key={m.title} className="flex items-center gap-4">
              <div className="w-40 shrink-0 truncate text-sm font-bold text-on-surface">
                {m.title}
              </div>
              <div className="h-6 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className={clsx(
                    "flex h-full items-center justify-end rounded-full pr-2 text-xs font-bold text-on-primary transition-all",
                    m.required ? "gradient-purple-pink" : "bg-teal-accent",
                  )}
                  style={{ width: `${Math.max(8, m.pct)}%` }}
                >
                  {m.pct}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-on-surface-variant">
          <Icon name="info" size={14} className="mr-1 align-middle" />
          Purple = required missions · Teal = optional. Connect Supabase for
          per-event analytics.
        </p>
      </div>
    </div>
  );
}
