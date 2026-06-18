import type { Metadata } from "next";
import { getBadges, getModules } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { MissionEditor } from "./MissionEditor";

export const metadata: Metadata = { title: "Admin · Journey Content" };

export default async function ContentEditorPage() {
  const [modules, badges] = await Promise.all([
    getModules(),
    Promise.resolve(getBadges()),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Journey Content</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Build the gamified missions from the ground up — reorder, add or
            remove missions, change the layout type, edit every field, and write
            rich body content block by block. Changes publish instantly to every
            starter&rsquo;s journey.
          </p>
        </div>
        <p className="flex items-center gap-1.5 rounded-lg bg-tertiary-fixed/40 px-3 py-2 text-xs font-bold text-on-tertiary-fixed-variant">
          <Icon name="bolt" size={16} fill /> Live editor
        </p>
      </div>

      <div className="mt-6">
        <MissionEditor modules={modules} badges={badges} />
      </div>
    </div>
  );
}
