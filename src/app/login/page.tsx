import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { isSupabaseConfigured } from "@/lib/config";
import { LoginForm } from "./LoginForm";
import { DemoLogin } from "./DemoLogin";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  { icon: "play_circle", text: "Welcome video from our leadership" },
  { icon: "diversity_3", text: "Meet the directors & our culture" },
  { icon: "workspace_premium", text: "Earn badges as you progress" },
  { icon: "emoji_events", text: "Finish with your official certificate" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden gradient-purple-pink p-12 text-on-primary lg:flex">
        <Logo size="text-3xl" href={null} />
        <div>
          <h1 className="text-5xl font-black leading-[1.05]">
            Welcome to your
            <br />
            PossAbilities
            <br />
            journey.
          </h1>
          <p className="mt-4 max-w-md text-lg text-primary-fixed">
            Live the life you choose. Let&rsquo;s get you settled in — your
            adventure with the team starts here.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-primary-fixed">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-on-primary/15">
                  <Icon name={h.icon} size={20} />
                </span>
                <span className="font-bold">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-primary-fixed/80">
          &copy; PossAbilities CIC · Live The Life You Choose
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="text-2xl" href={null} />
          </div>
          <h2 className="text-3xl font-black text-on-surface">Sign in</h2>
          <p className="mt-2 text-on-surface-variant">
            Pick up where you left off on your induction journey.
          </p>

          <div className="mt-8">
            {isSupabaseConfigured ? (
              <LoginForm />
            ) : (
              <>
                <div className="rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-3 text-sm text-on-tertiary-fixed-variant">
                  <p className="flex items-center gap-1.5 font-bold">
                    <Icon name="science" size={18} /> Demo mode
                  </p>
                  <p className="mt-1">
                    No backend is connected yet, so you can explore the whole
                    site with one click. Add Supabase keys to enable real logins.
                  </p>
                </div>
                <div className="mt-5">
                  <DemoLogin />
                </div>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Need access? Ask your manager to send an invite, or email{" "}
            <a
              href="mailto:digital@possabilities.org.uk"
              className="font-bold text-secondary"
            >
              digital@possabilities.org.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
