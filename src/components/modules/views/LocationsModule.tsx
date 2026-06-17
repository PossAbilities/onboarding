/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { getLocations } from "@/lib/data";
import type { ModuleViewProps } from "../types";

export function LocationsModule(props: ModuleViewProps) {
  const locations = getLocations();

  return (
    <ModuleScaffold {...props}>
      <div className="rounded-lg bg-surface-container-low p-5">
        <h2 className="text-xl font-extrabold text-on-surface">
          Locations &amp; Services
        </h2>
        <p className="mt-2 text-on-surface-variant">
          Explore where we work and the brilliant services we deliver across the
          region. Wherever you&rsquo;re based, you&rsquo;re part of one team.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {locations.map((loc) => (
          <Card key={loc.id} hover className="overflow-hidden">
            <img
              src={loc.imageUrl}
              alt={loc.name}
              width={800}
              height={450}
              className="aspect-video w-full rounded-t-lg object-cover"
            />
            <div className="p-5">
              <p className="text-lg font-extrabold text-on-surface">
                {loc.name}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm font-bold text-teal-accent">
                <Icon name="location_on" size={16} fill /> {loc.region}
              </p>
              <p className="mt-3 text-sm text-on-surface-variant">
                {loc.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {loc.services.map((service, i) => (
                  <Chip key={service} tone={i % 2 === 0 ? "teal" : "purple"}>
                    {service}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ModuleScaffold>
  );
}
