/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { EasterEgg } from "../EasterEgg";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { getPets } from "@/lib/data";
import type { ModuleViewProps } from "../types";

const WELLBEING = [
  {
    icon: "support_agent",
    title: "Employee Assistance Line",
    description: "24/7 confidential support for whatever life throws at you.",
  },
  {
    icon: "self_improvement",
    title: "Mindfulness & Movement",
    description: "Weekly sessions to help you reset, recharge and refocus.",
  },
  {
    icon: "health_and_safety",
    title: "Talk to someone",
    description: "Your wellbeing champions are always ready to listen.",
  },
];

export function PetsModule(props: ModuleViewProps) {
  const pets = getPets();

  return (
    <ModuleScaffold {...props}>
      <div className="rounded-lg bg-surface-container-low p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          Very Important Pets &amp; Wellbeing
          <EasterEgg eggId="egg-pets" hint="A furry friend was hiding a treat!" />
        </h2>
        <p className="mt-2 text-on-surface-variant">
          Our furry teammates are a huge part of our culture. Say hello to the
          office pets &mdash; then explore the support that keeps our team happy
          and healthy.
        </p>
      </div>

      <h2 className="mt-10 flex items-center gap-2 text-2xl font-black text-on-surface">
        <Icon name="pets" className="text-secondary" /> Meet the V.I.Ps
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pets.map((p) => (
          <Card key={p.id} hover className="overflow-hidden">
            <img
              src={p.photoUrl}
              alt={`${p.name}, ${p.species}`}
              width={600}
              height={600}
              className="aspect-square w-full rounded-t-lg object-cover"
            />
            <div className="p-4">
              <p className="text-lg font-extrabold text-on-surface">{p.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Chip tone="purple">{p.species}</Chip>
                <span className="text-xs font-bold text-on-surface-variant">
                  {p.owner}
                </span>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">{p.funFact}</p>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-black text-on-surface">
          <Icon name="health_and_safety" className="text-teal-accent" /> Wellbeing
          Hub
        </h2>
        <p className="mt-1 text-on-surface-variant">
          Looking after you, however you&rsquo;re feeling.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {WELLBEING.map((w) => (
            <Card key={w.title} hover className="overflow-hidden">
              <div className="p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl gradient-teal-pink text-on-primary">
                  <Icon name={w.icon} size={24} />
                </span>
                <p className="mt-3 text-lg font-extrabold text-on-surface">
                  {w.title}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {w.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </ModuleScaffold>
  );
}
