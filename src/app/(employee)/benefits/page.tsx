import type { Metadata } from "next";
import { getBenefits } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { Benefit } from "@/lib/types";

export const metadata: Metadata = { title: "PossAbilities Benefits" };

export default async function BenefitsPage() {
  const benefits = await getBenefits();
  // Group by category, preserving first-seen order.
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
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        PossAbilities Benefits
      </h1>
      <p className="mt-2 max-w-2xl text-on-surface-variant">
        When you thrive, we thrive. Here&rsquo;s everything that comes with
        being part of the Poss family &mdash; built to support your finances,
        your growth and your wellbeing.
      </p>

      {categories.map((cat) => (
        <section key={cat.name} className="mt-10">
          <h2 className="text-2xl font-black text-on-surface">{cat.name}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {cat.items.map((b) => (
              <Card
                key={b.id}
                hover
                className={
                  b.highlight ? "gradient-teal-pink text-on-primary" : undefined
                }
              >
                <div className="flex items-start gap-4 p-5">
                  <span
                    className={
                      b.highlight
                        ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20"
                        : "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-purple-pink text-on-primary"
                    }
                  >
                    <Icon name={b.icon} size={24} fill={b.highlight} />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-lg font-extrabold ${b.highlight ? "" : "text-on-surface"}`}
                    >
                      {b.title}
                    </p>
                    <p
                      className={`mt-1 text-sm ${b.highlight ? "text-on-primary/90" : "text-on-surface-variant"}`}
                    >
                      {b.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
