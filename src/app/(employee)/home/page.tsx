import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getJourneyState } from "@/lib/data";
import { getCandidateRecord, getReferences } from "@/lib/recruitment-data";
import {
  ONBOARDING_TASKS,
  computeChecklist,
  emptyRecord,
} from "@/lib/recruitment";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const profile = await requireProfile();
  const [record, references, journey] = await Promise.all([
    getCandidateRecord(profile.id),
    getReferences(profile.id),
    getJourneyState(profile),
  ]);
  const checklist = computeChecklist(
    record ?? emptyRecord(profile.id),
    references,
  );
  const byKey = new Map(checklist.items.map((i) => [i.key, i]));
  const nextTasks = ONBOARDING_TASKS.filter((t) => {
    const item = byKey.get(t.key);
    if (t.optional && record?.drivesForBusiness !== true) return false;
    return item && !item.done;
  }).slice(0, 3);

  const tiles = [
    {
      href: "/onboarding",
      icon: "checklist",
      title: "Onboarding",
      text: `${checklist.done} of ${checklist.total} checks complete — your tasks, what each one means, and your checklist.`,
      tone: "gradient-purple-pink text-on-primary",
    },
    {
      href: "/benefits",
      icon: "redeem",
      title: "PossAbilities Benefits",
      text: "Everything that comes with being part of the Poss family.",
      tone: "bg-surface-container-lowest",
    },
    {
      href: "/videos",
      icon: "smart_display",
      title: "Videos",
      text: "Hear from our staff and the people we support.",
      tone: "bg-surface-container-lowest",
    },
    {
      href: "/testimonials",
      icon: "format_quote",
      title: "Testimonials",
      text: "What our team and families say about working with us.",
      tone: "bg-surface-container-lowest",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Welcome to the Poss family, {profile.fullName.split(" ")[0]}! 💜
      </h1>
      <p className="mt-2 max-w-2xl text-on-surface-variant">
        This is your home while you get ready to join us. Work through your
        onboarding tasks, and the banner at the top will show your progress as
        each check is completed.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`journey-card-hover rounded-xl border border-outline-variant/60 p-5 journey-card-shadow ${t.tone}`}
          >
            <Icon name={t.icon} size={30} fill />
            <p className="mt-2 text-lg font-black">{t.title}</p>
            <p className="mt-1 text-sm opacity-85">{t.text}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-black text-on-surface">
          <Icon name="rocket_launch" className="text-secondary" fill /> Up next
        </h2>
        {nextTasks.length === 0 ? (
          <p className="mt-3 rounded-xl bg-success-green/10 p-4 font-bold text-[#1b7a44]">
            Nothing waiting on you right now — we&rsquo;ll let you know if we
            need anything else.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {nextTasks.map((t) => (
              <li
                key={t.key}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 journey-card-shadow"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-fixed text-primary-container">
                  <Icon name={t.icon} size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-on-surface">{t.title}</p>
                  <p className="text-sm text-on-surface-variant">
                    {byKey.get(t.key)?.status}
                  </p>
                </div>
                {t.href && (
                  <ButtonLink href={t.href} size="sm">
                    Open <Icon name="arrow_forward" size={16} />
                  </ButtonLink>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl bg-primary-container p-6 text-on-primary">
        <p className="text-xs font-bold uppercase tracking-widest text-inverse-primary">
          Induction journey · {journey.percentComplete}% complete
        </p>
        <p className="mt-1 text-xl font-black">
          Get to know PossAbilities while you wait
        </p>
        <p className="mt-1 text-sm text-primary-fixed">
          Meet the directors, learn our values and earn badges along the way.
        </p>
        <ButtonLink href="/journey" size="sm" className="mt-4">
          Go to my journey <Icon name="map" size={16} />
        </ButtonLink>
      </section>
    </div>
  );
}
