"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { saveRecruitmentSettingsAction } from "@/app/actions/recruitment";
import {
  OFFER_MERGE_TAGS,
  emptyRecord,
  renderOfferLetter,
  type RecruitmentSettings,
} from "@/lib/recruitment";

const SAMPLE = {
  fullName: "Alex Guru",
  department: "Supported Living",
  roleTag: "Support Worker",
  record: {
    ...emptyRecord("sample"),
    address: "12 Example Street\nRochdale\nOL16 1AA",
    salary: "£24,500 per annum",
    contractHours: "37.5 hours per week",
    startDate: "2026-11-02",
  },
};

function Section({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
      <h2 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name={icon} className="text-secondary" size={22} /> {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      )}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function RecruitmentSettingsEditor({
  initial,
}: {
  initial: RecruitmentSettings;
}) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const set = <K extends keyof RecruitmentSettings>(
    k: K,
    v: RecruitmentSettings[K],
  ) => setS((x) => ({ ...x, [k]: v }));

  const save = () =>
    startTransition(async () => {
      const res = await saveRecruitmentSettingsAction(s);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });

  const input =
    "field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-normal";
  const label = "block text-sm font-bold text-on-surface";
  const listField = (
    k: "dbsIdList" | "rtwBritish" | "rtwRestOfWorld" | "vehicleChecklist",
    title: string,
    hint?: string,
  ) => (
    <label className={label}>
      {title}
      {hint && (
        <span className="block text-xs font-normal text-on-surface-variant">
          {hint}
        </span>
      )}
      <textarea
        rows={Math.max(4, s[k].length + 1)}
        className={input}
        value={s[k].join("\n")}
        onChange={(e) => set(k, e.target.value.split("\n"))}
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Welcome pop-up & video"
        icon="celebration"
        description="Shown the first time a candidate logs in, before their offer letter."
      >
        <label className={label}>
          Pop-up heading
          <input
            className={input}
            value={s.welcomeTitle}
            onChange={(e) => set("welcomeTitle", e.target.value)}
          />
        </label>
        <label className={label}>
          Pop-up message
          <textarea
            rows={2}
            className={input}
            value={s.welcomeMessage}
            onChange={(e) => set("welcomeMessage", e.target.value)}
          />
        </label>
        <label className={label}>
          Video title
          <input
            className={input}
            value={s.welcomeVideoLabel}
            onChange={(e) => set("welcomeVideoLabel", e.target.value)}
          />
        </label>
        <div>
          <p className={label}>Welcome video from Rachel</p>
          <div className="mt-1 max-w-md">
            <MediaUpload
              value={s.welcomeVideoUrl}
              onChange={(url) => set("welcomeVideoUrl", url)}
              accept="video/*"
              kind="video"
              label="Welcome video"
            />
          </div>
        </div>
      </Section>

      <Section
        title="Conditional offer letter"
        icon="contract"
        description="HTML is supported. Merge tags are filled in with each candidate's details — set salary and hours when you set them up."
      >
        <div className="flex flex-wrap gap-1.5">
          {OFFER_MERGE_TAGS.map((t) => (
            <button
              key={t.tag}
              type="button"
              title={`Insert ${t.label}`}
              onClick={() =>
                set("offerLetterHtml", `${s.offerLetterHtml}${t.tag}`)
              }
              className="rounded-md bg-primary-fixed px-2 py-1 font-mono text-xs font-bold text-on-primary-fixed-variant"
            >
              {t.tag}
            </button>
          ))}
        </div>
        <textarea
          rows={16}
          className={`${input} font-mono text-xs`}
          value={s.offerLetterHtml}
          onChange={(e) => set("offerLetterHtml", e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="w-fit text-sm font-bold text-secondary"
        >
          <Icon name="visibility" size={16} className="align-middle" />{" "}
          {showPreview ? "Hide" : "Show"} preview with sample details
        </button>
        {showPreview && (
          <div
            className="letter rounded-lg border border-outline-variant/60 bg-surface-container-low p-5 text-on-surface"
            dangerouslySetInnerHTML={{
              __html: renderOfferLetter(s.offerLetterHtml, SAMPLE),
            }}
          />
        )}
      </Section>

      <Section
        title="Permission to request references"
        icon="approval_delegation"
        description="The document candidates sign before their referees are contacted."
      >
        <textarea
          rows={6}
          className={`${input} font-mono text-xs`}
          value={s.referencePermissionHtml}
          onChange={(e) => set("referencePermissionHtml", e.target.value)}
        />
      </Section>

      <Section
        title="Reference requests"
        icon="forward_to_inbox"
        description="Requests are emailed to referees automatically when a candidate submits their details. Edit the email wording in Email Templates."
      >
        <label className={label}>
          Reference form to attach (optional)
          <span className="block text-xs font-normal text-on-surface-variant">
            A public link to your reference form PDF. It&rsquo;s attached to
            every request and reminder; referees can also complete the reference
            online.
          </span>
          <input
            className={input}
            placeholder="https://…/reference-form.pdf"
            value={s.referenceFormUrl ?? ""}
            onChange={(e) => set("referenceFormUrl", e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>
            Remind outstanding referees every (days)
            <input
              type="number"
              min={1}
              max={30}
              className={input}
              value={s.reminderDays}
              onChange={(e) => set("reminderDays", Number(e.target.value))}
            />
          </label>
          <label className={label}>
            Stop after this many reminders (0 = never stop)
            <input
              type="number"
              min={0}
              max={50}
              className={input}
              value={s.maxReminders}
              onChange={(e) => set("maxReminders", Number(e.target.value))}
            />
          </label>
        </div>
      </Section>

      <Section
        title="DBS"
        icon="shield_person"
        description="Shown on the DBS task. One per line."
      >
        {listField("dbsIdList", "Accepted forms of ID")}
      </Section>

      <Section
        title="Right to work documents"
        icon="public"
        description="What candidates see after choosing their nationality. One per line — add “— Required” to the end of any line that is always required."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {listField(
            "rtwBritish",
            "British citizens",
            "Candidates need the required item plus only one of the rest.",
          )}
          {listField("rtwRestOfWorld", "Rest of the world")}
        </div>
      </Section>

      <Section
        title="Driving for business"
        icon="directions_car"
        description="Every item must be confirmed by candidates who drive for work. One per line."
      >
        {listField("vehicleChecklist", "Vehicle checklist")}
      </Section>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest/95 p-3 journey-card-shadow backdrop-blur lg:bottom-4">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary"
        >
          <Icon name="save" size={18} /> {pending ? "Saving…" : "Save settings"}
        </button>
        {msg && (
          <span
            className={`text-sm font-bold ${msg.ok ? "text-[#1b7a44]" : "text-error"}`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
