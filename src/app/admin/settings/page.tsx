import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/config";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";

export const metadata: Metadata = { title: "Admin · System Config" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black text-on-surface">System Config</h1>
      <p className="mt-1 text-on-surface-variant">
        Branding, journey rules and integrations.
      </p>

      {/* Backend status */}
      <div className="mt-6 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-on-surface">Backend</h2>
          {isSupabaseConfigured ? (
            <Chip tone="success" icon={<Icon name="cloud_done" size={16} fill />}>
              Supabase connected
            </Chip>
          ) : (
            <Chip tone="locked" icon={<Icon name="science" size={16} />}>
              Demo mode
            </Chip>
          )}
        </div>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isSupabaseConfigured
            ? "Real authentication, persisted progress and invite emails are active."
            : "Add your Supabase keys to .env.local to enable real logins, persisted progress and invite emails. See README.md."}
        </p>
      </div>

      {/* Journey rules */}
      <div className="mt-6 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
        <h2 className="text-lg font-black text-on-surface">Journey rules</h2>
        <div className="mt-3 flex flex-col divide-y divide-outline-variant/40">
          <Toggle
            label="Sequential unlock"
            note="Starters must complete required missions in order."
            on
          />
          <Toggle
            label="Gamification (XP & badges)"
            note="Award points and collectible badges for completed missions."
            on
          />
          <Toggle
            label="Easter-egg hunt"
            note="Hidden collectibles unlock the Navigator badge."
            on
          />
          <Toggle
            label="Email reminders"
            note="Nudge starters who stall for 3+ days."
            on={isSupabaseConfigured}
          />
        </div>
      </div>

      {/* Branding */}
      <div className="mt-6 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
        <h2 className="text-lg font-black text-on-surface">Branding</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Colours and typography follow the PossAbilities Brand Manual 1.1.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { name: "Pink", hex: "#ec008c" },
            { name: "Purple", hex: "#48065a" },
            { name: "Blue/Green", hex: "#66cccc" },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2 rounded-lg border border-outline-variant/50 px-3 py-2">
              <span className="h-6 w-6 rounded-full" style={{ background: c.hex }} />
              <span className="text-sm font-bold text-on-surface">{c.name}</span>
              <span className="text-xs text-on-surface-variant">{c.hex}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-sm font-bold text-on-surface-variant">
          <Icon name="format_quote" size={18} /> Strapline: &ldquo;Live The Life You Choose&rdquo;
        </p>
      </div>
    </div>
  );
}

function Toggle({ label, note, on }: { label: string; note: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-bold text-on-surface">{label}</p>
        <p className="text-sm text-on-surface-variant">{note}</p>
      </div>
      <span
        className={`flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${
          on ? "justify-end bg-secondary" : "justify-start bg-surface-container-highest"
        }`}
        aria-hidden
      >
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </div>
  );
}
