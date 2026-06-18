import type { Metadata } from "next";
import { getEmailTemplates } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/config";
import { isEmailConfigured } from "@/lib/mailer";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { EmailEditor } from "./EmailEditor";
import { ReminderRunner } from "./ReminderRunner";

export const metadata: Metadata = { title: "Admin · Email Templates" };

export default async function EmailsPage() {
  const templates = await getEmailTemplates();
  const staleDays = Number(process.env.REMINDER_STALE_DAYS ?? "3") || 3;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Email Templates</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Design the HTML emails the system sends to starters. Create and edit
            templates, drop in system merge-tags (name, course, due date,
            progress…), preview them, and send.
          </p>
        </div>
        {isEmailConfigured ? (
          <Chip tone="success" icon={<Icon name="mark_email_read" size={16} fill />}>
            Sending live (Resend)
          </Chip>
        ) : (
          <Chip tone="locked" icon={<Icon name="unsubscribe" size={16} />}>
            Sending not configured
          </Chip>
        )}
      </div>

      {!isEmailConfigured && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
          <Icon name="info" size={20} />
          <span>
            Design and preview everything now. To actually <strong>send</strong>{" "}
            (test sends, completion emails and the daily reminder job), add a{" "}
            <code className="font-mono">RESEND_API_KEY</code> — see the README.
            {!isSupabaseConfigured &&
              " The reminder job also needs Supabase connected."}
          </span>
        </div>
      )}

      <div className="mt-6">
        <ReminderRunner staleDays={staleDays} />
      </div>

      <div className="mt-6">
        <EmailEditor templates={templates} />
      </div>
    </div>
  );
}
