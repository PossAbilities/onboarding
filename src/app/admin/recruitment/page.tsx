import type { Metadata } from "next";
import { getRecruitmentSettings } from "@/lib/recruitment-data";
import { siteUrl } from "@/lib/config";
import { API_CHECK_KEYS, CHECKLIST_LABELS } from "@/lib/recruitment";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RecruitmentSettingsEditor } from "./RecruitmentSettingsEditor";

export const metadata: Metadata = { title: "Admin · Recruitment Setup" };

export default async function RecruitmentSetupPage() {
  const settings = await getRecruitmentSettings();
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface">
            Recruitment Setup
          </h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            The digital recruitment process: welcome video, conditional offer
            letter, onboarding tasks and reference requests.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/welcome" variant="outline" size="sm">
            <Icon name="visibility" size={18} /> Preview welcome
          </ButtonLink>
          <ButtonLink href="/offer" variant="outline" size="sm">
            <Icon name="contract" size={18} /> Preview offer
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6">
        <RecruitmentSettingsEditor initial={settings} />
      </div>

      <section className="mt-6 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
        <h2 className="flex items-center gap-2 text-lg font-black text-on-surface">
          <Icon name="sync" className="text-secondary" size={22} /> Ucheck &amp;
          Occupational Health sync
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          The DBS and health checklist items can be ticked automatically by
          another system. Create an API key in <strong>Integrations</strong>,
          then have Ucheck / Optima Health (or a connector such as Zapier) send:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-inverse-surface p-4 text-xs text-inverse-on-surface">{`POST ${siteUrl}/api/inbound/checklist
x-api-key: <your key>
Content-Type: application/json

{ "email": "candidate@example.com", "item": "dbs_complete", "done": true, "source": "Ucheck" }`}</pre>
        <p className="mt-3 text-sm text-on-surface-variant">
          Allowed items:{" "}
          {API_CHECK_KEYS.map((k, i) => (
            <span key={k}>
              <code className="rounded bg-surface-container px-1 font-mono text-xs">
                {k}
              </code>{" "}
              ({CHECKLIST_LABELS[k]})
              {i < API_CHECK_KEYS.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
