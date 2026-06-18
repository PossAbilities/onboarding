/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { ModuleVideo } from "../ModuleVideo";
import { EasterEgg } from "../EasterEgg";
import { ValuesGame } from "@/components/games/ValuesGame";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getValues } from "@/lib/data";
import { SAMPLE_VIDEO } from "@/lib/seed";
import type { ModuleViewProps } from "../types";

const AWARDS = [
  {
    name: "Sarah Jenkins",
    award: "Community Leader Award",
    note: "For outstanding dedication to person-centred care and championing the new Green Garden initiative.",
    img: "https://i.pravatar.cc/300?img=49",
  },
  {
    name: "Tom Okafor",
    award: "Innovation Star",
    note: "Turned a BIG Idea into a company-wide policy that saves the team hours every week.",
    img: "https://i.pravatar.cc/300?img=52",
  },
];

export async function CultureModule(props: ModuleViewProps) {
  const values = await getValues();
  return (
    <ModuleScaffold
      {...props}
      hero={
        <ModuleVideo
          moduleId={props.module.id}
          src={props.module.heroMediaUrl ?? SAMPLE_VIDEO}
          poster={props.module.heroPoster}
          label="Voices of PossAbilities"
          alreadyCompleted={props.alreadyCompleted}
        />
      }
    >
      {/* Values + mission */}
      <h2 className="flex items-center gap-2 text-2xl font-black text-on-surface">
        <Icon name="diversity_2" className="text-teal-accent" fill /> Our Values &amp; Mission
      </h2>
      <p className="mt-2 max-w-2xl text-on-surface-variant">
        These attitudes, beliefs and behaviours help us deliver our mission:
        pushing back the boundaries of what it means to be person-centred.
      </p>

      <div className="mt-5 rounded-xl gradient-purple-pink p-6 text-on-primary">
        <h3 className="text-xl font-black">Empowering Independence</h3>
        <p className="mt-2 max-w-2xl text-primary-fixed">
          Our mission is to dismantle barriers and build pathways. We believe
          every individual deserves the support to live their most fulfilling,
          independent life.{" "}
          <EasterEgg eggId="egg-culture" hint="A hidden value sparkle!" />
        </p>
      </div>

      {/* Game */}
      <div className="mt-8">
        <ValuesGame
          moduleId={props.module.id}
          alreadyCompleted={props.alreadyCompleted}
          values={values}
        />
      </div>

      {/* Staff awards */}
      <h2 className="mt-12 text-2xl font-black text-on-surface">
        Staff Awards Gallery
      </h2>
      <p className="mt-1 text-on-surface-variant">
        Celebrating the people who bring our values to life.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {AWARDS.map((a) => (
          <Card key={a.name} hover className="p-5">
            <div className="flex items-center gap-3">
              <img
                src={a.img}
                alt={a.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="font-extrabold text-on-surface">{a.name}</p>
                <p className="flex items-center gap-1 text-sm font-bold text-secondary">
                  <Icon name="emoji_events" size={16} fill /> {a.award}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">{a.note}</p>
          </Card>
        ))}
      </div>

      {/* Quote */}
      <figure className="mt-10 rounded-xl bg-primary-container p-6 text-on-primary">
        <Icon name="format_quote" className="text-inverse-primary" size={36} fill />
        <blockquote className="mt-1 text-lg font-bold">
          &ldquo;The BIG Idea allowed me to see my suggestion turn into a
          company-wide policy. That&rsquo;s real empowerment.&rdquo;
        </blockquote>
        <figcaption className="mt-3 text-sm text-primary-fixed">
          — A PossAbilities team member
        </figcaption>
      </figure>
    </ModuleScaffold>
  );
}
