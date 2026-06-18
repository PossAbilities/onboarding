"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        // Section-root links (/journey, /admin) match exactly; others also
        // match their nested routes.
        const isRoot = item.href === "/journey" || item.href === "/admin";
        const active = isRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
              active
                ? "bg-secondary text-on-secondary journey-card-shadow"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
            )}
          >
            <Icon name={item.icon} fill={active} size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
