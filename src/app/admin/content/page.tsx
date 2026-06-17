import type { Metadata } from "next";
import Link from "next/link";
import { getBadges, getModules } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import { ModuleEditor } from "./ModuleEditor";

export const metadata: Metadata = { title: "Admin · Journey Content" };

export default async function ContentEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const modules = getModules();
  const badges = getBadges();
  const selected = modules.find((mod) => mod.id === m) ?? modules[0];
  const badgeName = selected.badgeId
    ? (badges.find((b) => b.id === selected.badgeId)?.name ?? null)
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black text-on-surface">Journey Content</h1>
      <p className="mt-1 text-on-surface-variant">
        Configure the gamified missions, rewards and media. Changes publish
        instantly to every starter&rsquo;s journey.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Mission path list */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 journey-card-shadow">
          <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Mission Path
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {modules.map((mod, i) => (
              <li key={mod.id}>
                <Link
                  href={`/admin/content?m=${mod.id}`}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    mod.id === selected.id
                      ? "bg-secondary text-on-secondary"
                      : "hover:bg-surface-container",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
                      mod.id === selected.id
                        ? "bg-on-secondary/20"
                        : "bg-surface-container-high text-on-surface-variant",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {mod.shortTitle}
                    </span>
                    <span
                      className={clsx(
                        "block truncate text-xs",
                        mod.id === selected.id
                          ? "text-on-secondary/80"
                          : "text-on-surface-variant",
                      )}
                    >
                      {mod.kind}
                    </span>
                  </span>
                  {mod.required && mod.id !== selected.id && (
                    <Chip tone="locked">Req</Chip>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-outline-variant px-3 py-2.5 text-sm font-bold text-on-surface-variant"
            title="Adding new modules is on the roadmap"
          >
            <Icon name="add" size={18} /> Add Module
          </button>
        </div>

        {/* Editor */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
          <div className="mb-4 flex items-center justify-between">
            <Chip tone="purple">Editing · {selected.shortTitle}</Chip>
            <Link
              href={`/modules/${selected.slug}`}
              className="flex items-center gap-1 text-sm font-bold text-secondary hover:underline"
            >
              <Icon name="visibility" size={18} /> Preview
            </Link>
          </div>
          <ModuleEditor module={selected} badgeName={badgeName} />
        </div>
      </div>
    </div>
  );
}
