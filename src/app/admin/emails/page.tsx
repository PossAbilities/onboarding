import type { Metadata } from "next";
import { getEmailTemplates } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/config";
import { Icon } from "@/components/ui/Icon";
import { EmailEditor } from "./EmailEditor";

export const metadata: Metadata = { title: "Admin · Email Templates" };

export default async function EmailsPage() {
  const templates = await getEmailTemplates();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black text-on-surface">Email Templates</h1>
      <p className="mt-1 max-w-2xl text-on-surface-variant">
        Design the HTML emails the system sends to starters. Create and edit
        templates, drop in system merge-tags (name, course, due date, progress…),
        and preview exactly how each one will look.
      </p>

      {!isSupabaseConfigured && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
          <Icon name="info" size={20} />
          <span>
            You can fully design and preview templates now. To actually{" "}
            <strong>send</strong> them, connect Supabase and an email provider
            (e.g. Resend) — see the README. Welcome emails already go out via
            Supabase invites.
          </span>
        </div>
      )}

      <div className="mt-6">
        <EmailEditor templates={templates} />
      </div>
    </div>
  );
}
