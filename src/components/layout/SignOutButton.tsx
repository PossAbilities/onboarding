"use client";

import { signOut } from "@/app/actions/auth";
import { Icon } from "@/components/ui/Icon";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-secondary"
      >
        <Icon name="logout" size={20} />
        {!compact && "Sign out"}
      </button>
    </form>
  );
}
