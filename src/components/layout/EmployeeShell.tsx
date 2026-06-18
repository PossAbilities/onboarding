import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/Button";
import { SidebarNav, type NavItem } from "./SidebarNav";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { getJourneyState, getMyNotifications } from "@/lib/data";
import { statusFor } from "@/lib/journey";
import type { Profile } from "@/lib/types";

const NAV: NavItem[] = [
  { href: "/journey", label: "My Journey", icon: "map" },
  { href: "/milestones", label: "Milestones", icon: "flag" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { href: "/badges", label: "Badges", icon: "workspace_premium" },
  { href: "/documents", label: "Documents", icon: "draw" },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: "menu_book" },
];

export async function EmployeeShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const [journey, notifications] = await Promise.all([
    getJourneyState(profile),
    getMyNotifications(profile.id),
  ]);
  const nextModule =
    journey.modules.find(
      (m) => statusFor(m.id, journey.progress) === "in_progress",
    ) ??
    journey.modules.find(
      (m) => statusFor(m.id, journey.progress) === "available",
    );

  const nav = profile.isAdmin
    ? [...NAV, { href: "/admin", label: "Admin Panel", icon: "admin_panel_settings" }]
    : NAV;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-6 border-r border-outline-variant/50 bg-surface-container-low p-5 lg:flex">
        <Logo size="text-2xl" />

        <div className="rounded-xl bg-surface-container-lowest p-4 journey-card-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Journey Progress
          </p>
          <p className="mt-1 text-2xl font-black text-primary-container">
            {journey.percentComplete}%
          </p>
          <ProgressBar value={journey.percentComplete} className="mt-2" />
        </div>

        <SidebarNav items={nav} />

        {nextModule && (
          <div className="mt-auto rounded-xl bg-primary-container p-4 text-on-primary">
            <p className="text-xs font-bold uppercase tracking-wide text-inverse-primary">
              Next Mission
            </p>
            <p className="mt-1 text-lg font-extrabold leading-tight">
              {nextModule.shortTitle}
            </p>
            <ButtonLink
              href={`/modules/${nextModule.slug}`}
              size="sm"
              className="mt-3 w-full"
            >
              <Icon name="rocket_launch" size={18} /> Resume Mission
            </ButtonLink>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-outline-variant/50 bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <Link href="/journey" className="lg:hidden">
            <Logo size="text-lg" />
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              href="/journey"
              className="rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-secondary"
            >
              Journey
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-secondary"
            >
              Community
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <span className="hidden items-center gap-1 rounded-full bg-tertiary-fixed px-3 py-1.5 text-xs font-bold text-on-tertiary-fixed-variant sm:inline-flex">
              <Icon name="bolt" size={16} fill /> {profile.journeyPoints} XP
            </span>
            <NotificationBell items={notifications} />
            <UserMenu
              name={profile.fullName}
              roleTag={profile.roleTag}
              avatarUrl={profile.avatarUrl}
              isAdmin={profile.isAdmin}
            />
          </div>
        </header>

        {/* Mobile bottom nav */}
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>

        <MobileTabBar isAdmin={profile.isAdmin} />
      </div>
    </div>
  );
}

function MobileTabBar({ isAdmin }: { isAdmin: boolean }) {
  const tabs = [
    { href: "/journey", label: "Journey", icon: "map" },
    { href: "/badges", label: "Badges", icon: "workspace_premium" },
    { href: "/leaderboard", label: "Social", icon: "groups" },
    isAdmin
      ? { href: "/admin", label: "Admin", icon: "admin_panel_settings" }
      : { href: "/knowledge-hub", label: "Hub", icon: "menu_book" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-outline-variant/50 bg-surface-container-lowest px-2 py-2 lg:hidden">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] font-bold text-on-surface-variant"
        >
          <Icon name={t.icon} size={24} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
