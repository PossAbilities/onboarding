import type { Metadata } from "next";
import Link from "next/link";
import {
  getBadges,
  getBenefits,
  getDirectors,
  getLocations,
  getManagers,
  getPets,
  getValues,
  type CollectionName,
} from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";
import { CollectionEditor } from "@/components/admin/CollectionEditor";

export const metadata: Metadata = { title: "Admin · Content Library" };

const TABS: { key: CollectionName; label: string; icon: string }[] = [
  { key: "managers", label: "Managers", icon: "supervisor_account" },
  { key: "directors", label: "Directors", icon: "groups" },
  { key: "benefits", label: "Benefits", icon: "redeem" },
  { key: "pets", label: "Pets", icon: "pets" },
  { key: "locations", label: "Locations", icon: "location_on" },
  { key: "values", label: "Values", icon: "diversity_2" },
  { key: "badges", label: "Badges", icon: "workspace_premium" },
];

type Item = Record<string, unknown> & { id: string };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active: CollectionName =
    (TABS.find((t) => t.key === tab)?.key as CollectionName) ?? "managers";

  const items = await loadCollection(active);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black text-on-surface">Content Library</h1>
      <p className="mt-1 max-w-2xl text-on-surface-variant">
        Total control of every piece of content on the journey — add, edit,
        reorder, delete and upload photos for your directors, benefits, pets,
        locations and badges. Changes publish instantly.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-outline-variant/50 pb-3">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/library?tab=${t.key}`}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
              t.key === active
                ? "bg-secondary text-on-secondary"
                : "text-on-surface-variant hover:bg-surface-container",
            )}
          >
            <Icon name={t.icon} size={18} fill={t.key === active} />
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <CollectionEditor name={active} items={items} />
      </div>
    </div>
  );
}

async function loadCollection(name: CollectionName): Promise<Item[]> {
  switch (name) {
    case "managers":
      return (await getManagers()) as unknown as Item[];
    case "directors":
      return (await getDirectors()) as unknown as Item[];
    case "benefits":
      return (await getBenefits()) as unknown as Item[];
    case "pets":
      return (await getPets()) as unknown as Item[];
    case "locations":
      return (await getLocations()) as unknown as Item[];
    case "badges":
      return (await getBadges()) as unknown as Item[];
    case "values":
      return (await getValues()) as unknown as Item[];
  }
}
