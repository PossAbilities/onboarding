import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "@/components/layout/SignOutButton";

/** Minimal full-screen chrome for the welcome video + offer letter steps. */
export function GateShell({
  children,
  step,
}: {
  children: ReactNode;
  step: 1 | 2 | 3;
}) {
  return (
    <div className="min-h-screen bg-background-soft">
      <header className="flex items-center gap-4 border-b border-outline-variant/50 bg-surface-container-lowest px-4 py-3 md:px-8">
        <Logo size="text-xl" href={null} />
        <ol className="ml-auto hidden items-center gap-2 text-xs font-bold text-on-surface-variant sm:flex">
          {["Welcome", "Offer letter", "Onboarding"].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  i + 1 < step
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-teal-accent text-tertiary"
                    : i + 1 === step
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-on-secondary"
                      : "flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-highest text-outline"
                }
              >
                {i + 1}
              </span>
              {label}
              {i < 2 && <span className="mx-1 h-px w-6 bg-outline-variant" />}
            </li>
          ))}
        </ol>
        <div className="ml-auto sm:ml-4">
          <SignOutButton compact />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">{children}</main>
    </div>
  );
}
