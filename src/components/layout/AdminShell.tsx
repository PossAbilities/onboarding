import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SidebarNav, type NavItem } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";
import type { Profile } from "@/lib/types";

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/starters", label: "Manage Starters", icon: "group_add" },
  { href: "/admin/managers", label: "Managers", icon: "supervisor_account" },
  { href: "/admin/content", label: "Journey Content", icon: "edit_document" },
  { href: "/admin/library", label: "Content Library", icon: "perm_media" },
  { href: "/admin/emails", label: "Email Templates", icon: "mail" },
  { href: "/admin/documents", label: "Documents", icon: "draw" },
  { href: "/admin/integrations", label: "Integrations", icon: "hub" },
  { href: "/admin/analytics", label: "Analytics", icon: "monitoring" },
  { href: "/admin/settings", label: "System Config", icon: "settings" },
];

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background-soft">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 bg-primary p-5 text-on-primary lg:flex">
        <div>
          <Logo size="text-xl" href="/admin" onDark />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-inverse-primary">
            Admin Console
          </p>
        </div>

        <div className="[&_a]:text-primary-fixed/80">
          <AdminNav />
        </div>

        <div className="mt-auto rounded-xl bg-primary-container p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-inverse-primary">
            System Health
          </p>
          <p className="mt-1 text-sm font-bold">All systems operational</p>
          <ProgressBar value={98} className="mt-2" />
        </div>

        <Link
          href="/journey"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-primary-fixed/80 hover:text-on-primary"
        >
          <Icon name="arrow_back" size={20} /> Back to my journey
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-outline-variant/50 bg-surface-container-lowest px-4 py-3 md:px-8">
          <Link href="/admin" className="lg:hidden">
            <Logo size="text-lg" />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-success-green/15 px-3 py-1.5 text-xs font-bold text-[#1b7a44] sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-success-green" /> Verified by System
            </span>
            <div className="flex items-center gap-2">
              <Avatar src={profile.avatarUrl} name={profile.fullName} size={36} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-extrabold leading-tight text-on-surface">
                  {profile.fullName}
                </p>
                <p className="text-[11px] text-on-surface-variant">Admin User</p>
              </div>
            </div>
            <div className="w-px self-stretch bg-outline-variant/50" />
            <SignOutButton compact />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-outline-variant/50 bg-surface-container-lowest px-2 py-2 lg:hidden">
          {ADMIN_NAV.slice(0, 4).map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold text-on-surface-variant"
            >
              <Icon name={t.icon} size={22} />
              {t.label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function AdminNav() {
  return <SidebarNav items={ADMIN_NAV} />;
}
