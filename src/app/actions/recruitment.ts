"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { addNotification, starterEventData } from "@/lib/data";
import { dispatchEvent } from "@/lib/integrations";
import {
  deleteReference,
  getCandidateRecord,
  getProfileById,
  getReferences,
  saveRecruitmentSettings,
  saveReferences,
  sendDraftReferences,
  sendReferenceEmail,
  submitReferenceResponse,
  updateCandidateRecord,
  updateReference,
  type ReferenceInput,
} from "@/lib/recruitment-data";
import {
  CHECKLIST_LABELS,
  DEFAULT_SETTINGS,
  missingMandatoryReferences,
  validateEmploymentHistory,
  type ChecklistKey,
  type DrivingDetails,
  type EmploymentHistory,
  type RecruitmentSettings,
  type RtwRoute,
} from "@/lib/recruitment";

type Result = { ok: boolean; message: string };

function refreshCandidate() {
  revalidatePath("/", "layout");
}

const MAX_SIGNATURE = 400_000; // ~400KB PNG data URL is plenty for a signature

function cleanSignature(name: string, data: string | null) {
  const signedName = name.trim();
  if (!signedName) return null;
  const signatureData =
    data &&
    data.startsWith("data:image/png;base64,") &&
    data.length < MAX_SIGNATURE
      ? data
      : null;
  return { signedName, signatureData, signedAt: new Date().toISOString() };
}

/* ─────────────────────────── Candidate ─────────────────────────── */

/** The welcome video has been watched — move on to the offer letter. */
export async function markWelcomeWatchedAction(): Promise<Result> {
  const profile = await requireProfile();
  const rec = await getCandidateRecord(profile.id);
  if (!rec?.welcomeWatchedAt) {
    await updateCandidateRecord(profile.id, {
      welcomeWatchedAt: new Date().toISOString(),
    });
  }
  refreshCandidate();
  return { ok: true, message: "Saved." };
}

export async function signOfferAction(
  name: string,
  signatureData: string | null,
): Promise<Result> {
  const profile = await requireProfile();
  const sig = cleanSignature(name, signatureData);
  if (!sig)
    return { ok: false, message: "Please type your full name to sign." };
  const rec = await getCandidateRecord(profile.id);
  if (rec?.offerSignature) return { ok: true, message: "Already signed." };
  await updateCandidateRecord(profile.id, {
    offerSignature: sig,
    welcomeWatchedAt: rec?.welcomeWatchedAt ?? sig.signedAt,
  });
  await addNotification(profile.id, {
    title: "Offer accepted — welcome to the Poss family! 🎉",
    body: "Your onboarding tasks are ready. Let's get you started.",
    icon: "celebration",
    href: "/onboarding",
  });
  const base = await starterEventData(profile);
  await dispatchEvent("document.signed", {
    ...base,
    document_id: "offer-letter",
    document_title: "Conditional Offer Letter",
    signed_name: sig.signedName,
    signed_at: sig.signedAt,
  });
  refreshCandidate();
  return { ok: true, message: "Signed." };
}

export async function signReferencePermissionAction(
  name: string,
  signatureData: string | null,
): Promise<Result> {
  const profile = await requireProfile();
  const sig = cleanSignature(name, signatureData);
  if (!sig)
    return { ok: false, message: "Please type your full name to sign." };
  await updateCandidateRecord(profile.id, { referencePermission: sig });
  const base = await starterEventData(profile);
  await dispatchEvent("document.signed", {
    ...base,
    document_id: "reference-permission",
    document_title: "Permission to request references",
    signed_name: sig.signedName,
    signed_at: sig.signedAt,
  });
  refreshCandidate();
  return { ok: true, message: "Signed." };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Save reference details. With `submit`, the mandatory references must be
 * present and the permission form signed; the requests are then emailed to
 * each referee automatically.
 */
export async function saveReferencesAction(
  refs: ReferenceInput[],
  submit: boolean,
): Promise<Result> {
  const profile = await requireProfile();
  if (!Array.isArray(refs) || refs.length > 30)
    return { ok: false, message: "Invalid references." };
  for (const r of refs) {
    if (!r.refereeName?.trim()) {
      return {
        ok: false,
        message:
          "Please add the referee's name to each reference you've started.",
      };
    }
    if (!EMAIL_RE.test(r.refereeEmail?.trim() ?? "")) {
      return {
        ok: false,
        message: `Please enter a valid email address for ${r.refereeName}.`,
      };
    }
  }
  const rec = await getCandidateRecord(profile.id);
  if (submit && !rec?.referencePermission) {
    return {
      ok: false,
      message: "Please sign the permission to request references first.",
    };
  }

  const saved = await saveReferences(profile.id, refs);
  if (!submit) {
    refreshCandidate();
    return { ok: true, message: "Draft saved." };
  }

  const missing = missingMandatoryReferences(saved);
  if (missing.length) {
    refreshCandidate();
    return { ok: false, message: `Please add your ${missing.join(" and ")}.` };
  }
  await updateCandidateRecord(profile.id, {
    referencesSubmittedAt: new Date().toISOString(),
  });
  const results = await sendDraftReferences(profile.id, profile.fullName);
  const failed = results.filter((r) => !r.ok).length;
  refreshCandidate();
  return failed
    ? {
        ok: true,
        message: `Thanks — your references are saved. ${failed} request${failed === 1 ? "" : "s"} couldn't be emailed yet; the HR team will follow up.`,
      }
    : { ok: true, message: "Thanks — we've emailed your referees for you." };
}

export async function confirmDbsAction(done: boolean): Promise<Result> {
  const profile = await requireProfile();
  await updateCandidateRecord(profile.id, {
    dbsSubmittedAt: done ? new Date().toISOString() : null,
  });
  refreshCandidate();
  return {
    ok: true,
    message: done ? "Thanks — marked as completed." : "Updated.",
  };
}

export async function saveEmploymentHistoryAction(
  history: EmploymentHistory,
  submit: boolean,
): Promise<Result & { problems?: string[] }> {
  const profile = await requireProfile();
  if (
    !history ||
    !Array.isArray(history.entries) ||
    history.entries.length > 60
  ) {
    return { ok: false, message: "Invalid employment history." };
  }
  const clean: EmploymentHistory = {
    leftEducation: String(history.leftEducation ?? ""),
    entries: history.entries.map((e) => ({
      id: String(e.id),
      employer: String(e.employer ?? "").slice(0, 200),
      jobTitle: String(e.jobTitle ?? "").slice(0, 200),
      startMonth: String(e.startMonth ?? ""),
      endMonth: String(e.endMonth ?? ""),
      careOrEducation: !!e.careOrEducation,
      reasonForLeaving: String(e.reasonForLeaving ?? "").slice(0, 2000),
    })),
    gaps: (history.gaps ?? []).map((g) => ({
      from: String(g.from),
      to: String(g.to),
      explanation: String(g.explanation ?? "").slice(0, 2000),
    })),
  };
  if (submit) {
    const problems = validateEmploymentHistory(clean);
    if (problems.length) {
      await updateCandidateRecord(profile.id, { employmentHistory: clean });
      return {
        ok: false,
        message: "Please fix the items below before submitting.",
        problems,
      };
    }
  }
  const rec = await getCandidateRecord(profile.id);
  await updateCandidateRecord(profile.id, {
    employmentHistory: clean,
    employmentSubmittedAt: submit
      ? new Date().toISOString()
      : (rec?.employmentSubmittedAt ?? null),
    // A re-submission needs checking again.
    checks:
      submit && rec?.checks.employment_history
        ? { ...rec.checks, employment_history: undefined }
        : (rec?.checks ?? {}),
  });
  refreshCandidate();
  return {
    ok: true,
    message: submit
      ? "Submitted — the HR team will check it and tick it off."
      : "Draft saved.",
  };
}

export async function saveRightToWorkAction(input: {
  route: RtwRoute;
  shareCode: string;
}): Promise<Result> {
  const profile = await requireProfile();
  if (input.route !== "british" && input.route !== "rest_of_world") {
    return { ok: false, message: "Please choose your nationality group." };
  }
  const shareCode = String(input.shareCode ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 20);
  if (input.route === "rest_of_world" && !shareCode) {
    return { ok: false, message: "Please enter your share code." };
  }
  await updateCandidateRecord(profile.id, {
    rtwRoute: input.route,
    shareCode: input.route === "rest_of_world" ? shareCode : "",
    rtwSubmittedAt: new Date().toISOString(),
  });
  refreshCandidate();
  return {
    ok: true,
    message: "Saved — please bring or send the documents listed.",
  };
}

export async function saveDrivingAction(input: {
  drives: boolean;
  details?: DrivingDetails;
  submit?: boolean;
}): Promise<Result> {
  const profile = await requireProfile();
  if (!input.drives) {
    await updateCandidateRecord(profile.id, {
      drivesForBusiness: false,
      drivingSubmittedAt: null,
    });
    refreshCandidate();
    return {
      ok: true,
      message: "Got it — driving for business doesn't apply to you.",
    };
  }
  const d = input.details;
  const details: DrivingDetails | null = d
    ? {
        vehicleChecks: (d.vehicleChecks ?? []).map(String).slice(0, 30),
        insurer: String(d.insurer ?? "").slice(0, 200),
        policyNumber: String(d.policyNumber ?? "").slice(0, 100),
        insuranceExpiry: String(d.insuranceExpiry ?? ""),
        businessUseCover: !!d.businessUseCover,
        licenceLast8: String(d.licenceLast8 ?? "")
          .trim()
          .toUpperCase()
          .slice(0, 8),
        // The DVLA check code is case sensitive — store it exactly as typed.
        checkCode: String(d.checkCode ?? "")
          .trim()
          .slice(0, 20),
      }
    : null;
  if (input.submit) {
    const s = await import("@/lib/recruitment-data").then((m) =>
      m.getRecruitmentSettings(),
    );
    if (!details) return { ok: false, message: "Please complete the form." };
    if (details.vehicleChecks.length < s.vehicleChecklist.length)
      return {
        ok: false,
        message: "Please confirm every item on the vehicle checklist.",
      };
    if (!details.insurer || !details.policyNumber || !details.insuranceExpiry)
      return { ok: false, message: "Please add your insurance details." };
    if (!details.businessUseCover)
      return {
        ok: false,
        message: "Please confirm your insurance covers business use.",
      };
    if (details.licenceLast8.length !== 8)
      return {
        ok: false,
        message:
          "Please enter the last 8 characters of your driving licence number.",
      };
    if (!details.checkCode)
      return { ok: false, message: "Please enter your licence check code." };
  }
  await updateCandidateRecord(profile.id, {
    drivesForBusiness: true,
    ...(details ? { driving: details } : {}),
    ...(input.submit ? { drivingSubmittedAt: new Date().toISOString() } : {}),
  });
  refreshCandidate();
  return {
    ok: true,
    message: input.submit ? "Submitted — thank you!" : "Saved.",
  };
}

/* ─────────────────────────── Referee (public) ─────────────────────────── */

export async function submitRefereeFormAction(
  token: string,
  response: Record<string, string>,
): Promise<Result> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(response ?? {}).slice(0, 40)) {
    clean[String(k).slice(0, 60)] = String(v ?? "").slice(0, 4000);
  }
  if (!clean.referee_name?.trim() || !clean.confirm) {
    return {
      ok: false,
      message: "Please add your name and tick the declaration.",
    };
  }
  const res = await submitReferenceResponse(token, clean);
  if (res.ok && res.userId) {
    await addNotification(res.userId, {
      title: "A reference has been returned ✅",
      body: "One of your referees has completed their reference.",
      icon: "mark_email_read",
      href: "/onboarding",
    });
  }
  return { ok: res.ok, message: res.message };
}

/* ───────────────────────────── Admin ───────────────────────────── */

const CHECK_KEYS = Object.keys(CHECKLIST_LABELS) as ChecklistKey[];

/** Tick / untick a checklist item, or `null` to go back to the automatic value. */
export async function setCheckAction(
  userId: string,
  key: ChecklistKey,
  done: boolean | null,
): Promise<Result> {
  const admin = await requireAdmin();
  if (!CHECK_KEYS.includes(key))
    return { ok: false, message: "Unknown checklist item." };
  const rec = await getCandidateRecord(userId);
  const checks = { ...(rec?.checks ?? {}) };
  if (done === null) delete checks[key];
  else checks[key] = { done, at: new Date().toISOString(), by: admin.fullName };
  await updateCandidateRecord(userId, { checks });
  revalidatePath(`/admin/starters/${userId}`);
  revalidatePath("/admin/starters");
  return { ok: true, message: "Checklist updated." };
}

const NI_RE = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/i;

export async function updateCandidateDetailsAction(
  userId: string,
  input: {
    address: string;
    dateOfBirth: string;
    niNumber: string;
    jobTitle: string;
    salary: string;
    contractHours: string;
    startDate: string;
  },
): Promise<Result> {
  await requireAdmin();
  const ni = input.niNumber.replace(/\s+/g, "").toUpperCase();
  if (ni && !NI_RE.test(ni))
    return {
      ok: false,
      message: "That National Insurance number doesn't look right.",
    };
  await updateCandidateRecord(userId, {
    address: input.address.trim(),
    dateOfBirth: input.dateOfBirth,
    niNumber: ni,
    jobTitle: input.jobTitle.trim(),
    salary: input.salary.trim(),
    contractHours: input.contractHours.trim(),
    startDate: input.startDate,
  });
  revalidatePath(`/admin/starters/${userId}`);
  return { ok: true, message: "Details saved." };
}

/** Send (or resend as a reminder) one reference request. */
export async function sendReferenceAction(
  refId: string,
  userId: string,
): Promise<Result> {
  await requireAdmin();
  const ref = (await getReferences(userId, { withSecrets: true })).find(
    (r) => r.id === refId,
  );
  if (!ref) return { ok: false, message: "Reference not found." };
  const profile = await getProfileById(userId);
  const res = await sendReferenceEmail(
    ref,
    profile?.fullName ?? "the candidate",
    ref.status === "draft" ? "request" : "reminder",
  );
  revalidatePath(`/admin/starters/${userId}`);
  return res;
}

export async function markReferenceReceivedAction(
  refId: string,
  userId: string,
  received: boolean,
): Promise<Result> {
  const admin = await requireAdmin();
  await updateReference(
    refId,
    received
      ? {
          status: "received",
          receivedAt: new Date().toISOString(),
          response: { note: `Marked as received by ${admin.fullName}` },
        }
      : { status: "requested", receivedAt: null },
  );
  revalidatePath(`/admin/starters/${userId}`);
  return {
    ok: true,
    message: received ? "Marked as received." : "Marked as outstanding.",
  };
}

export async function deleteReferenceAction(
  refId: string,
  userId: string,
): Promise<Result> {
  await requireAdmin();
  await deleteReference(refId);
  revalidatePath(`/admin/starters/${userId}`);
  return { ok: true, message: "Reference removed." };
}

/** Let a candidate see the welcome video / offer letter again (e.g. after a change). */
export async function resetOfferAction(userId: string): Promise<Result> {
  await requireAdmin();
  await updateCandidateRecord(userId, { offerSignature: null });
  revalidatePath(`/admin/starters/${userId}`);
  return {
    ok: true,
    message: "The candidate will be asked to sign the offer letter again.",
  };
}

export async function saveRecruitmentSettingsAction(
  s: RecruitmentSettings,
): Promise<Result> {
  await requireAdmin();
  const list = (v: unknown) =>
    Array.isArray(v)
      ? v
          .map((x) => String(x).trim())
          .filter(Boolean)
          .slice(0, 50)
      : [];
  const clean: RecruitmentSettings = {
    welcomeTitle:
      String(s.welcomeTitle ?? "").trim() || DEFAULT_SETTINGS.welcomeTitle,
    welcomeMessage: String(s.welcomeMessage ?? ""),
    welcomeVideoUrl: s.welcomeVideoUrl?.trim() || null,
    welcomeVideoLabel: String(s.welcomeVideoLabel ?? ""),
    offerLetterHtml:
      String(s.offerLetterHtml ?? "") || DEFAULT_SETTINGS.offerLetterHtml,
    referencePermissionHtml:
      String(s.referencePermissionHtml ?? "") ||
      DEFAULT_SETTINGS.referencePermissionHtml,
    dbsIdList: list(s.dbsIdList),
    rtwBritish: list(s.rtwBritish),
    rtwRestOfWorld: list(s.rtwRestOfWorld),
    vehicleChecklist: list(s.vehicleChecklist),
    referenceFormUrl: s.referenceFormUrl?.trim() || null,
    reminderDays: Math.min(
      30,
      Math.max(1, Math.round(Number(s.reminderDays) || 3)),
    ),
    maxReminders: Math.min(
      50,
      Math.max(0, Math.round(Number(s.maxReminders) || 0)),
    ),
  };
  await saveRecruitmentSettings(clean);
  revalidatePath("/", "layout");
  return { ok: true, message: "Recruitment settings saved." };
}
