/**
 * Catalogue of platform events that can trigger an outbound integration, and the
 * data tokens each one makes available for the URL / headers / body templates.
 * Client-safe (used by the admin editor's token palette and previews).
 */

export interface IntegrationField {
  key: string;
  label: string;
  sample: string;
}

export interface IntegrationEventDef {
  value: string;
  label: string;
  description: string;
  fields: IntegrationField[];
}

const STARTER_FIELDS: IntegrationField[] = [
  { key: "full_name", label: "Full name", sample: "Alex Guru" },
  { key: "first_name", label: "First name", sample: "Alex" },
  { key: "email", label: "Email", sample: "alex@possabilities.org.uk" },
  { key: "role", label: "Job role", sample: "Support Worker" },
  { key: "department", label: "Department", sample: "Supported Living" },
  { key: "manager_name", label: "Manager", sample: "Priya Patel" },
  { key: "starter_id", label: "Starter ID", sample: "u_12345" },
];

export const INTEGRATION_EVENTS: IntegrationEventDef[] = [
  {
    value: "photo.submitted",
    label: "Profile photo submitted",
    description:
      "Fires when a starter saves their ID/profile photo. Ideal for creating an ID badge task in your task manager.",
    fields: [
      ...STARTER_FIELDS,
      { key: "photo_url", label: "Photo URL", sample: "https://…/photo.jpg" },
      { key: "submitted_at", label: "Submitted at", sample: "2026-06-18T09:00:00Z" },
    ],
  },
  {
    value: "starter.invited",
    label: "New starter invited",
    description: "Fires when an admin invites a new starter.",
    fields: [
      ...STARTER_FIELDS,
      { key: "invited_by", label: "Invited by", sample: "Jordan Admin" },
    ],
  },
  {
    value: "document.signed",
    label: "Document signed",
    description: "Fires when a starter digitally signs a document.",
    fields: [
      ...STARTER_FIELDS,
      { key: "document_id", label: "Document ID", sample: "doc-contract" },
      { key: "document_title", label: "Document title", sample: "Statement of Terms" },
      { key: "signed_name", label: "Signed name", sample: "Alex Guru" },
      { key: "signed_at", label: "Signed at", sample: "2026-06-18T09:00:00Z" },
    ],
  },
  {
    value: "module.completed",
    label: "Mission completed",
    description: "Fires each time a starter completes a journey mission.",
    fields: [
      ...STARTER_FIELDS,
      { key: "module_id", label: "Mission ID", sample: "m-welcome" },
      { key: "module_title", label: "Mission title", sample: "The Welcome" },
    ],
  },
  {
    value: "journey.completed",
    label: "Journey completed",
    description: "Fires when a starter finishes their whole induction.",
    fields: [
      ...STARTER_FIELDS,
      { key: "certificate_serial", label: "Certificate no.", sample: "PA-2026-AB12" },
    ],
  },
  {
    value: "idea.submitted",
    label: "BIG Idea submitted",
    description: "Fires when someone submits a BIG Idea.",
    fields: [
      { key: "author_name", label: "Author", sample: "Alex Guru" },
      { key: "title", label: "Idea title", sample: "Paperless onboarding" },
      { key: "description", label: "Description", sample: "Digitise all contracts…" },
      { key: "category", label: "Category", sample: "People" },
    ],
  },
];

export function eventDef(value: string): IntegrationEventDef | undefined {
  return INTEGRATION_EVENTS.find((e) => e.value === value);
}

export function sampleDataFor(value: string): Record<string, string> {
  const def = eventDef(value);
  return Object.fromEntries((def?.fields ?? []).map((f) => [f.key, f.sample]));
}

/** Replace {{token}} placeholders in any string with values (unknown → ""). */
export function renderTokens(input: string, data: Record<string, string>): string {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, k: string) =>
    k in data ? data[k] : "",
  );
}
