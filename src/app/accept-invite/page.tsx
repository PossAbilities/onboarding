import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { isSupabaseConfigured } from "@/lib/config";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const metadata: Metadata = { title: "Accept your invite" };

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-soft p-6">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 journey-card-shadow">
        <Logo size="text-2xl" href={null} />
        <h1 className="mt-6 text-2xl font-black text-on-surface">
          You&rsquo;re invited! 🎉
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Welcome to the team. Set a password to activate your account and begin
          your PossAbilities induction journey.
        </p>

        <div className="mt-6">
          {isSupabaseConfigured ? (
            <AcceptInviteForm />
          ) : (
            <div className="rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
              <p className="flex items-center gap-1.5 font-bold">
                <Icon name="science" size={18} /> Demo mode
              </p>
              <p className="mt-1">
                Invites are emailed once Supabase is connected. For now,{" "}
                <Link href="/login" className="font-bold underline">
                  use the demo login
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
