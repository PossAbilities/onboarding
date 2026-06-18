import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";

export const metadata: Metadata = { title: "Knowledge Hub" };

const RESOURCES = [
  {
    group: "Getting set up",
    items: [
      { icon: "laptop_mac", title: "IT & systems setup", note: "Get your logins, email and devices ready.", tag: "5 mins" },
      { icon: "badge", title: "Your ID & access", note: "How to get your staff pass and building access.", tag: "Required" },
      { icon: "schedule", title: "Rotas & timesheets", note: "Where to find your shifts and log your hours.", tag: "Guide" },
    ],
  },
  {
    group: "Policies & handbook",
    items: [
      { icon: "menu_book", title: "Employee handbook", note: "Everything you need to know, in one place.", tag: "PDF" },
      { icon: "health_and_safety", title: "Safeguarding policy", note: "Our commitment to keeping people safe.", tag: "Required" },
      { icon: "gavel", title: "Code of conduct", note: "How we treat each other and the people we support.", tag: "Policy" },
    ],
  },
  {
    group: "Brand & comms",
    items: [
      { icon: "palette", title: "Brand toolkit", note: "Logos, colours and templates. 'Live the life you choose.'", tag: "Toolkit" },
      { icon: "campaign", title: "Internal comms", note: "How we keep everyone in the loop.", tag: "Guide" },
      { icon: "support_agent", title: "Who to ask", note: "Key contacts across the organisation.", tag: "Directory" },
    ],
  },
];

export default async function KnowledgeHubPage() {
  await requireProfile();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Knowledge Hub
      </h1>
      <p className="mt-2 max-w-xl text-on-surface-variant">
        Your library of handy resources. Bookmark this — it&rsquo;s here whenever
        you need it, long after induction.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
        <Icon name="search" className="text-on-surface-variant" />
        <input
          placeholder="Search resources… (e.g. 'pension', 'rota')"
          className="field-focus w-full rounded-lg bg-transparent py-2 text-on-surface outline-none"
        />
      </div>

      <Link
        href="/my-logins"
        className="mt-6 flex items-center gap-4 rounded-xl border border-secondary/30 bg-secondary-fixed/30 p-4 journey-card-hover"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-purple-pink text-on-primary">
          <Icon name="vpn_key" fill size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-on-surface">My Logins (secure)</p>
          <p className="text-sm text-on-surface-variant">
            Safely store your sign-ins for the systems you use while you get set
            up — encrypted, private, and auto-deleted after 30 days.
          </p>
        </div>
        <Icon name="arrow_forward" className="text-on-surface-variant" />
      </Link>

      {RESOURCES.map((section) => (
        <section key={section.group} className="mt-8">
          <h2 className="text-xl font-black text-on-surface">{section.group}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <button
                key={item.title}
                type="button"
                className="flex flex-col items-start rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 text-left journey-card-hover journey-card-shadow"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
                  <Icon name={item.icon} fill size={22} />
                </span>
                <p className="mt-3 font-extrabold text-on-surface">{item.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{item.note}</p>
                <Chip tone="neutral" className="mt-3">
                  {item.tag}
                </Chip>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
