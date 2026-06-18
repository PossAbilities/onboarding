import { ModuleScaffold } from "../ModuleScaffold";
import { EasterEgg } from "../EasterEgg";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getBenefits } from "@/lib/data";
import type { Benefit } from "@/lib/types";
import type { ModuleViewProps } from "../types";

const STATS = [
  { figure: "£24k", label: "Employee Assistance fund", icon: "volunteer_activism" },
  { figure: "100+", label: "Retail & leisure discounts", icon: "local_offer" },
  { figure: "£500", label: "Up to, for your BIG Idea", icon: "emoji_objects" },
];

export async function BenefitsModule(props: ModuleViewProps) {
  const benefits = await getBenefits();

  // Group benefits by category, preserving first-seen order.
  const categories: { name: string; items: Benefit[] }[] = [];
  for (const b of benefits) {
    let group = categories.find((c) => c.name === b.category);
    if (!group) {
      group = { name: b.category, items: [] };
      categories.push(group);
    }
    group.items.push(b);
  }

  return (
    <ModuleScaffold {...props}>
      <div className="rounded-lg bg-surface-container-low p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          Your Life, Your Perks
          <EasterEgg eggId="egg-benefits" hint="A cheeky perk was hiding here!" />
        </h2>
        <p className="mt-2 text-on-surface-variant">
          When you thrive, we thrive. Here&rsquo;s everything that comes with
          being part of the team &mdash; built to support your finances, your
          growth, and your wellbeing.
        </p>
      </div>

      {/* Fun stats strip */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-purple-pink text-on-primary">
                <Icon name={s.icon} size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-black leading-none text-on-surface">
                  {s.figure}
                </p>
                <p className="mt-1 text-xs font-bold text-on-surface-variant">
                  {s.label}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categories.map((cat) => (
        <section key={cat.name} className="mt-10">
          <h2 className="text-2xl font-black text-on-surface">{cat.name}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {cat.items.map((b) =>
              b.highlight ? (
                <Card
                  key={b.id}
                  hover
                  className="overflow-hidden gradient-teal-pink text-on-primary"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-on-primary">
                        <Icon name={b.icon} size={24} fill />
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-on-primary">
                          {b.title}
                        </p>
                        <p className="mt-1 text-sm text-on-primary/90">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card key={b.id} hover className="overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-purple-pink text-on-primary">
                        <Icon name={b.icon} size={24} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-on-surface">
                          {b.title}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        </section>
      ))}
    </ModuleScaffold>
  );
}
