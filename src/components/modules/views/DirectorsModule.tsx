/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { EasterEgg } from "../EasterEgg";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getDirectors } from "@/lib/data";
import type { ModuleViewProps } from "../types";

export async function DirectorsModule(props: ModuleViewProps) {
  const directors = await getDirectors();
  return (
    <ModuleScaffold {...props}>
      <div className="rounded-lg bg-surface-container-low p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          The leadership team
          <EasterEgg eggId="egg-directors" hint="A director left a treat!" />
        </h2>
        <p className="mt-2 text-on-surface-variant">
          Four people, one mission. Meet the directors below — completing this
          mission earns you the{" "}
          <strong className="text-secondary">People Person</strong> badge.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {directors.map((d) => (
          <Card key={d.id} hover className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <img
                src={d.photoUrl}
                alt={d.name}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-on-surface">{d.name}</p>
                <p className="flex items-center gap-1 text-sm font-bold text-secondary">
                  <Icon name="badge" size={16} /> {d.role}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">{d.bio}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ModuleScaffold>
  );
}
