/**
 * Digital recruitment / pre-employment onboarding.
 *
 * Client-safe: shared types, the onboarding task catalogue (copy from HR's
 * "Digital Recruitment Process" brief), default settings and the checklist
 * logic. Server-side reads/writes live in `recruitment-data.ts`.
 *
 * Flow for a new candidate:
 *   admin sets them up → invite email → first login shows the congratulations
 *   pop-up + welcome video → conditional offer letter (confetti + e-sign) →
 *   home page with a progress banner and the onboarding tasks/checklist.
 */

export type RtwRoute = "british" | "rest_of_world";
export type ReferenceKind = "employer" | "care_education" | "personal";
export type ReferenceStatus = "draft" | "requested" | "received";

export interface Signature {
  signedName: string;
  signatureData: string | null; // PNG data URL of the drawn signature
  signedAt: string;
}

export interface EmploymentEntry {
  id: string;
  employer: string;
  jobTitle: string;
  startMonth: string; // "YYYY-MM"
  endMonth: string; // "YYYY-MM", or "" while still employed there
  careOrEducation: boolean; // health & social care or education role
  reasonForLeaving: string;
}

export interface EmploymentGap {
  from: string; // "YYYY-MM" — first month not covered
  to: string; // "YYYY-MM" — last month not covered
  explanation: string;
}

export interface EmploymentHistory {
  leftEducation: string; // "YYYY-MM" the candidate left education / started work
  entries: EmploymentEntry[];
  gaps: EmploymentGap[];
}

export interface DrivingDetails {
  vehicleChecks: string[]; // vehicle checklist items the candidate confirmed
  insurer: string;
  policyNumber: string;
  insuranceExpiry: string; // "YYYY-MM-DD"
  businessUseCover: boolean;
  licenceLast8: string; // last 8 characters of the driving licence number
  checkCode: string; // DVLA "view driving licence" share code (case sensitive)
}

/** Keys of the HR checklist, in display order. */
export type ChecklistKey =
  | "offer_letter"
  | "reference_permission"
  | "reference_details"
  | "dbs_application"
  | "health_questionnaire"
  | "employment_history"
  | "right_to_work"
  | "references_received"
  | "dbs_complete"
  | "health_clearance"
  | "driving";

export interface CheckMark {
  done: boolean;
  at: string;
  by: string; // admin name, "Candidate", or the API key source (e.g. "Ucheck")
  note?: string;
}

/** One candidate's recruitment record (one per starter). */
export interface CandidateRecord {
  userId: string;
  // Captured by admin at setup.
  address: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  niNumber: string;
  jobTitle: string;
  salary: string;
  contractHours: string;
  startDate: string; // "YYYY-MM-DD"
  // Candidate progress.
  welcomeWatchedAt: string | null;
  offerSignature: Signature | null;
  referencePermission: Signature | null;
  referencesSubmittedAt: string | null;
  dbsSubmittedAt: string | null;
  employmentHistory: EmploymentHistory | null;
  employmentSubmittedAt: string | null;
  rtwRoute: RtwRoute | null;
  shareCode: string;
  rtwSubmittedAt: string | null;
  drivesForBusiness: boolean | null;
  driving: DrivingDetails | null;
  drivingSubmittedAt: string | null;
  // Manual ticks / overrides by admins or the inbound API.
  checks: Partial<Record<ChecklistKey, CheckMark>>;
  updatedAt: string | null;
}

export interface CandidateReference {
  id: string;
  userId: string;
  kind: ReferenceKind;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  organisation: string;
  refereePosition: string; // referee's job title
  candidateRole: string; // the candidate's role at that organisation
  relationship: string; // for personal references
  startMonth: string;
  endMonth: string;
  status: ReferenceStatus;
  token: string; // secret for the referee's online form
  requestedAt: string | null;
  lastSentAt: string | null;
  reminderCount: number;
  receivedAt: string | null;
  response: Record<string, string> | null;
  lastError: string | null;
  createdAt: string;
}

export function emptyRecord(userId: string): CandidateRecord {
  return {
    userId,
    address: "",
    dateOfBirth: "",
    niNumber: "",
    jobTitle: "",
    salary: "",
    contractHours: "",
    startDate: "",
    welcomeWatchedAt: null,
    offerSignature: null,
    referencePermission: null,
    referencesSubmittedAt: null,
    dbsSubmittedAt: null,
    employmentHistory: null,
    employmentSubmittedAt: null,
    rtwRoute: null,
    shareCode: "",
    rtwSubmittedAt: null,
    drivesForBusiness: null,
    driving: null,
    drivingSubmittedAt: null,
    checks: {},
    updatedAt: null,
  };
}

/* ───────────────────────────── Settings ─────────────────────────────
 * Admin-editable (Admin → Recruitment Setup). Stored in app_settings under
 * the `recruitment` key; these are the defaults.
 */
export interface RecruitmentSettings {
  welcomeTitle: string;
  welcomeMessage: string;
  welcomeVideoUrl: string | null;
  welcomeVideoLabel: string;
  offerLetterHtml: string;
  referencePermissionHtml: string;
  dbsIdList: string[];
  rtwBritish: string[];
  rtwRestOfWorld: string[];
  vehicleChecklist: string[];
  referenceFormUrl: string | null; // optional PDF attached to reference requests
  reminderDays: number;
  maxReminders: number;
}

export const OFFER_MERGE_TAGS = [
  { tag: "{{full_name}}", label: "Full name" },
  { tag: "{{first_name}}", label: "First name" },
  { tag: "{{address}}", label: "Address" },
  { tag: "{{job_title}}", label: "Job title" },
  { tag: "{{department}}", label: "Department" },
  { tag: "{{salary}}", label: "Salary" },
  { tag: "{{contract_hours}}", label: "Contracted hours" },
  { tag: "{{start_date}}", label: "Start date" },
  { tag: "{{today}}", label: "Today's date" },
];

export const DEFAULT_SETTINGS: RecruitmentSettings = {
  welcomeTitle: "Congratulations on being offered a role at PossAbilities!",
  welcomeMessage:
    "We're so pleased you're joining us. Before anything else, Rachel has a short message to welcome you to the Poss family.",
  welcomeVideoUrl: null,
  welcomeVideoLabel: "A welcome from Rachel",
  offerLetterHtml: `<p>{{today}}</p>
<p>{{full_name}}<br/>{{address}}</p>
<p>Dear {{first_name}},</p>
<h3>Conditional offer of employment</h3>
<p>We are delighted to offer you the position of <strong>{{job_title}}</strong> with PossAbilities CIC, in the <strong>{{department}}</strong> team.</p>
<ul>
<li><strong>Salary:</strong> {{salary}}</li>
<li><strong>Contractual hours:</strong> {{contract_hours}}</li>
<li><strong>Anticipated start date:</strong> {{start_date}}</li>
</ul>
<p>This offer is conditional on the following being completed to our satisfaction:</p>
<ul>
<li>Satisfactory references covering your employment history</li>
<li>An Enhanced DBS check</li>
<li>Proof of your right to work in the UK</li>
<li>Occupational health clearance</li>
<li>A full employment history with any gaps explained</li>
</ul>
<p>Your onboarding tasks on this site will guide you through each of these. Once everything has been received your offer will be confirmed and your contract issued.</p>
<p>Please sign below to accept this conditional offer.</p>
<p>Welcome to the Poss family!</p>`,
  referencePermissionHtml: `<p>I give permission for PossAbilities CIC to contact the referees I provide, on my behalf, to request references covering my previous employment and my character.</p>
<p>I understand that the information provided by my referees will be used to assess my suitability for employment, and will be handled in line with PossAbilities' data protection policy.</p>`,
  dbsIdList: [
    "Current valid passport (any nationality)",
    "Biometric Residence Permit (UK)",
    "Current UK driving licence (photocard)",
    "Birth certificate (UK and Channel Islands) issued at the time of birth",
    "Adoption certificate (UK and Channel Islands)",
    "Marriage / civil partnership certificate",
    "P45 or P60 statement (UK)",
    "Bank or building society statement (issued in the last 3 months)",
    "Utility bill (not mobile phone) issued in the last 3 months",
    "Council tax statement (issued in the last 12 months)",
  ],
  rtwBritish: [
    "Proof of National Insurance number — required",
    "Passport",
    "Birth certificate",
    "Adoption certificate",
    "Certificate of Registration",
    "Certificate of Naturalisation",
  ],
  rtwRestOfWorld: [
    "Proof of National Insurance number — required",
    "Passport",
    "Share Code check",
    "University enrolment letter (if attending university)",
    "University timetable with course name and your name clearly detailed",
    "Certificate of Sponsorship (if on a sponsorship visa)",
  ],
  vehicleChecklist: [
    "My vehicle has a valid MOT (if over 3 years old)",
    "My vehicle is taxed",
    "My insurance includes business use",
    "Tyres, lights, brakes and wipers are in good working order",
    "I will report any change to my licence, insurance or vehicle",
  ],
  referenceFormUrl: null,
  reminderDays: 3,
  maxReminders: 5,
};

/* ───────────────────────── Onboarding tasks ─────────────────────────
 * The task list shown to candidates, with HR's explanation for each.
 */
export interface OnboardingTask {
  key: ChecklistKey;
  title: string;
  icon: string;
  explained: string;
  href: string | null; // page where the candidate completes it
  optional?: boolean;
}

export const ONBOARDING_TASKS: OnboardingTask[] = [
  {
    key: "offer_letter",
    title: "Conditional Offer Letter",
    icon: "contract",
    explained:
      "You'll have already signed this. It sets out your salary and contractual hours.",
    href: "/offer",
  },
  {
    key: "reference_permission",
    title: "Permission to request references",
    icon: "approval_delegation",
    explained:
      "Please sign this document. It gives us permission to contact your referees on your behalf.",
    href: "/onboarding/references",
  },
  {
    key: "reference_details",
    title: "Reference Details",
    icon: "contact_mail",
    explained:
      "Please provide details for your referees. Your most recent employer and a personal reference are required. If you have ever worked in health & social care or education, we need a reference for each of those employments.",
    href: "/onboarding/references",
  },
  {
    key: "dbs_application",
    title: "DBS application",
    icon: "shield_person",
    explained:
      "You'll need to provide 3 forms of ID from the accepted list. You'll receive an email from Ucheck where you can complete your application. You can either use the digital option to verify your ID, or bring your documents into your local PossAbilities office.",
    href: "/onboarding#dbs",
  },
  {
    key: "health_questionnaire",
    title: "Health Questionnaire",
    icon: "health_and_safety",
    explained:
      "This will come to you from our Occupational Health provider. We ask for it to get a clear overview of any health conditions, so we can make sure any reasonable adjustments are in place for you.",
    href: "/onboarding#health",
  },
  {
    key: "employment_history",
    title: "Employment History",
    icon: "work_history",
    explained:
      "Please complete your entire employment history, going back to when you left education or started your first job. Include the start and finish months of each job, explain any gaps in employment, and give a reason for leaving any position in health & social care or education.",
    href: "/onboarding/employment-history",
  },
  {
    key: "right_to_work",
    title: "Right to Work",
    icon: "badge",
    explained:
      "You'll need to provide your right to work documents to prove you are eligible to work in the UK. Choose your nationality to see exactly what's needed.",
    href: "/onboarding/right-to-work",
  },
  {
    key: "driving",
    title: "Driving for business",
    icon: "directions_car",
    optional: true,
    explained:
      "Optional — only if you will drive as part of your job. You'll need to complete the vehicle checklist, provide your business insurance, and generate a code so we can check your licence.",
    href: "/onboarding/driving",
  },
];

export const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  offer_letter: "Conditional Offer Letter",
  reference_permission: "Permission to request references",
  reference_details: "Reference details",
  dbs_application: "DBS application",
  health_questionnaire: "Health Questionnaire",
  employment_history: "Employment History",
  right_to_work: "Right to Work",
  references_received: "References received",
  dbs_complete: "DBS complete",
  health_clearance: "Health Questionnaire outcome",
  driving: "Driving for business",
};

/** How each checklist line gets ticked (shown to admins). */
export const CHECKLIST_HOW: Record<ChecklistKey, string> = {
  offer_letter: "Ticks automatically once signed",
  reference_permission: "Ticks automatically once signed",
  reference_details: "Ticks automatically once provided",
  dbs_application: "Candidate confirms, or admin / Ucheck API",
  health_questionnaire: "Admin, or Occupational Health API",
  employment_history: "Admin checks the submission, then ticks",
  right_to_work: "Admin ticks once documents are received",
  references_received: "Ticks automatically when every reference is returned",
  dbs_complete: "Admin, or Ucheck API",
  health_clearance: "Admin, or Occupational Health API",
  driving: "Admin ticks once driving documents are provided",
};

/** Keys the inbound API (Ucheck / Occupational Health) may set. */
export const API_CHECK_KEYS: ChecklistKey[] = [
  "dbs_application",
  "dbs_complete",
  "health_questionnaire",
  "health_clearance",
];

export interface ChecklistItem {
  key: ChecklistKey;
  label: string;
  done: boolean;
  doneAt: string | null;
  by: string | null;
  status: string; // short human status, e.g. "Awaiting 2 of 3"
  applicable: boolean;
}

/** A reference counts as a real entry once the key contact details are in. */
export function isReferenceFilled(
  r: Pick<CandidateReference, "refereeName" | "refereeEmail">,
) {
  return r.refereeName.trim().length > 0 && r.refereeEmail.trim().length > 0;
}

export function missingMandatoryReferences(
  refs: CandidateReference[],
): string[] {
  const missing: string[] = [];
  if (!refs.some((r) => r.kind === "employer" && isReferenceFilled(r)))
    missing.push("most recent employer");
  if (!refs.some((r) => r.kind === "personal" && isReferenceFilled(r)))
    missing.push("personal reference");
  return missing;
}

export function computeChecklist(
  rec: CandidateRecord,
  refs: CandidateReference[],
): { items: ChecklistItem[]; done: number; total: number; percent: number } {
  const filled = refs.filter(isReferenceFilled);
  const received = filled.filter((r) => r.status === "received");

  const auto: Record<
    ChecklistKey,
    { done: boolean; at: string | null; status: string }
  > = {
    offer_letter: {
      done: !!rec.offerSignature,
      at: rec.offerSignature?.signedAt ?? null,
      status: rec.offerSignature ? "Signed" : "Awaiting signature",
    },
    reference_permission: {
      done: !!rec.referencePermission,
      at: rec.referencePermission?.signedAt ?? null,
      status: rec.referencePermission ? "Signed" : "Awaiting signature",
    },
    reference_details: {
      done:
        !!rec.referencesSubmittedAt &&
        missingMandatoryReferences(refs).length === 0,
      at: rec.referencesSubmittedAt,
      status: rec.referencesSubmittedAt
        ? `${filled.length} provided`
        : "Not provided yet",
    },
    dbs_application: {
      done: !!rec.dbsSubmittedAt,
      at: rec.dbsSubmittedAt,
      status: rec.dbsSubmittedAt ? "Application completed" : "Not started",
    },
    health_questionnaire: {
      done: false,
      at: null,
      status: "Awaiting Occupational Health",
    },
    employment_history: {
      done: false,
      at: null,
      status: rec.employmentSubmittedAt
        ? "Submitted — awaiting admin check"
        : "Not submitted",
    },
    right_to_work: {
      done: false,
      at: null,
      status: rec.rtwSubmittedAt
        ? "Details given — awaiting documents"
        : "Not started",
    },
    references_received: {
      done:
        filled.length > 0 &&
        received.length === filled.length &&
        !!rec.referencesSubmittedAt,
      at:
        received
          .map((r) => r.receivedAt ?? "")
          .sort()
          .at(-1) || null,
      status: filled.length
        ? `${received.length} of ${filled.length} returned`
        : "No references yet",
    },
    dbs_complete: { done: false, at: null, status: "Awaiting DBS certificate" },
    health_clearance: { done: false, at: null, status: "Awaiting outcome" },
    driving: {
      done: false,
      at: null,
      status:
        rec.drivesForBusiness === false
          ? "Not applicable"
          : rec.drivingSubmittedAt
            ? "Submitted — awaiting admin check"
            : "Not provided",
    },
  };

  const keys = Object.keys(CHECKLIST_LABELS) as ChecklistKey[];
  const items: ChecklistItem[] = keys.map((key) => {
    const mark = rec.checks[key];
    const a = auto[key];
    // A manual tick/untick by an admin (or the API) always wins.
    const done = mark ? mark.done : a.done;
    return {
      key,
      label: CHECKLIST_LABELS[key],
      done,
      doneAt: mark ? mark.at : a.at,
      by: mark ? mark.by : a.done ? "Automatic" : null,
      status: done ? "Complete" : a.status,
      applicable: key === "driving" ? rec.drivesForBusiness === true : true,
    };
  });

  const counted = items.filter((i) => i.applicable);
  const done = counted.filter((i) => i.done).length;
  return {
    items,
    done,
    total: counted.length,
    percent: counted.length ? Math.round((done / counted.length) * 100) : 0,
  };
}

/* ───────────────────────── Employment gaps ────────────────────────── */

const monthIndex = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};
const monthString = (i: number) =>
  `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(ym: string): string {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym || "—";
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Find uncovered months between leaving education and now. Any gap of one
 * full month or more needs an explanation.
 */
export function findGaps(
  leftEducation: string,
  entries: EmploymentEntry[],
): { from: string; to: string }[] {
  if (!/^\d{4}-\d{2}$/.test(leftEducation)) return [];
  const now = monthIndex(currentMonth());
  const spans = entries
    .filter((e) => /^\d{4}-\d{2}$/.test(e.startMonth))
    .map((e) => ({
      s: monthIndex(e.startMonth),
      e: /^\d{4}-\d{2}$/.test(e.endMonth) ? monthIndex(e.endMonth) : now,
    }))
    .sort((a, b) => a.s - b.s);

  const gaps: { from: string; to: string }[] = [];
  // `cursor` is the last month accounted for. Starting a job the month after
  // leaving the previous one is not a gap.
  let cursor = monthIndex(leftEducation);
  for (const span of spans) {
    if (span.s - 1 >= cursor + 1) {
      gaps.push({ from: monthString(cursor + 1), to: monthString(span.s - 1) });
    }
    cursor = Math.max(cursor, span.e);
  }
  if (now - 1 >= cursor + 1) {
    gaps.push({ from: monthString(cursor + 1), to: monthString(now - 1) });
  }
  return gaps;
}

/** Validation for an employment-history submission. Returns a list of problems. */
export function validateEmploymentHistory(h: EmploymentHistory): string[] {
  const problems: string[] = [];
  if (!/^\d{4}-\d{2}$/.test(h.leftEducation))
    problems.push("Tell us when you left education or started your first job.");
  // No jobs at all is allowed (e.g. just left education) — the time since then
  // is simply reported as a gap to explain.
  h.entries.forEach((e, i) => {
    const n = `Job ${i + 1}`;
    if (!e.employer.trim()) problems.push(`${n}: add the employer's name.`);
    if (!e.jobTitle.trim()) problems.push(`${n}: add your job title.`);
    if (!/^\d{4}-\d{2}$/.test(e.startMonth))
      problems.push(`${n}: add the start month.`);
    if (e.endMonth && e.startMonth && e.endMonth < e.startMonth)
      problems.push(`${n}: the finish month is before the start month.`);
    if (e.careOrEducation && e.endMonth && !e.reasonForLeaving.trim())
      problems.push(
        `${n}: a reason for leaving is required for health & social care / education roles.`,
      );
  });
  for (const g of findGaps(h.leftEducation, h.entries)) {
    const given = h.gaps.find((x) => x.from === g.from && x.to === g.to);
    if (!given?.explanation.trim())
      problems.push(
        `Explain the gap from ${formatMonth(g.from)} to ${formatMonth(g.to)}.`,
      );
  }
  return problems;
}

/* ─────────────────────────── Offer letter ─────────────────────────── */

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Fill the offer-letter template with the candidate's details (HTML-escaped). */
export function renderOfferLetter(
  html: string,
  data: {
    fullName: string;
    department: string | null;
    roleTag: string;
    record: CandidateRecord;
  },
): string {
  const tbc = "To be confirmed";
  const values: Record<string, string> = {
    full_name: data.fullName,
    first_name: data.fullName.split(" ")[0] ?? "",
    address: data.record.address.replace(/\n/g, ", ") || "",
    job_title: data.record.jobTitle || data.roleTag,
    department: data.department ?? "PossAbilities",
    salary: data.record.salary || tbc,
    contract_hours: data.record.contractHours || tbc,
    start_date: formatDate(data.record.startDate) || tbc,
    today: formatDate(new Date().toISOString()),
  };
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) =>
    k in values ? escapeHtml(values[k]) : m,
  );
}

export const REFERENCE_KIND_LABEL: Record<ReferenceKind, string> = {
  employer: "Most recent employer",
  care_education: "Health & social care / education employer",
  personal: "Personal reference",
};
