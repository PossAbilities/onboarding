import type { Metadata } from "next";
import { getManagers } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { CollectionEditor } from "@/components/admin/CollectionEditor";

export const metadata: Metadata = { title: "Admin · Managers" };

type Item = Record<string, unknown> & { id: string };

export default async function ManagersPage() {
  const managers = (await getManagers()) as unknown as Item[];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black text-on-surface">Managers</h1>
      <p className="mt-1 max-w-2xl text-on-surface-variant">
        Add and manage the managers whose intro videos appear on their starters&rsquo;
        &ldquo;Meet Your Manager&rdquo; mission. Upload each manager&rsquo;s photo
        and welcome video, set their role and department, then assign them to
        starters from <strong>Manage Starters</strong>.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
        <Icon name="movie" size={20} />
        Tip: each manager&rsquo;s <strong>Intro video</strong> is what their
        assigned new starters watch. Upload an MP4 or paste a video URL.
      </div>

      <div className="mt-6">
        <CollectionEditor name="managers" items={managers} />
      </div>
    </div>
  );
}
