"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/app/actions/auth";

export function UserMenu({
  name,
  roleTag,
  avatarUrl,
  isAdmin,
}: {
  name: string;
  roleTag: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 transition-transform hover:scale-105"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={avatarUrl} name={name} size={40} ring />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-2 shadow-xl float-in"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-extrabold text-on-surface">{name}</p>
            <p className="text-xs text-on-surface-variant">{roleTag}</p>
          </div>
          <div className="my-1 h-px bg-outline-variant/50" />
          <Link
            href="/badges"
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="workspace_premium" size={20} /> My Badges
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="admin_panel_settings" size={20} /> Admin Dashboard
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-secondary hover:bg-surface-container"
            >
              <Icon name="logout" size={20} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
