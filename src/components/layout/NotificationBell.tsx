"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/journey";
import type { AppNotification } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell({ items }: { items: AppNotification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Optimistic read-state overlaid on the server-provided items.
  const [readIds, setReadIds] = useState<string[]>([]);
  const [allRead, setAllRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const list = useMemo(
    () =>
      items.map((n) => ({
        ...n,
        read: n.read || allRead || readIds.includes(n.id),
      })),
    [items, allRead, readIds],
  );
  const unread = list.filter((n) => !n.read).length;

  const openNotif = (n: AppNotification) => {
    if (!n.read) {
      setReadIds((ids) => [...ids, n.id]);
      markNotificationReadAction(n.id);
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  const markAll = () => {
    setAllRead(true);
    markAllNotificationsReadAction();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <Icon name="notifications" size={22} fill={unread > 0} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-on-secondary">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xl float-in">
          <div className="flex items-center justify-between border-b border-outline-variant/50 px-4 py-3">
            <p className="font-black text-on-surface">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-bold text-secondary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-on-surface-variant">
              <Icon name="notifications_off" size={28} />
              <p className="text-sm font-bold">You&rsquo;re all caught up</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotif(n)}
                    className={clsx(
                      "flex w-full items-start gap-3 border-b border-outline-variant/30 px-4 py-3 text-left transition-colors hover:bg-surface-container-low",
                      !n.read && "bg-secondary-fixed/30",
                    )}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-purple-pink text-on-primary">
                      <Icon name={n.icon} size={18} fill />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-on-surface">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-on-surface-variant">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-outline">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
