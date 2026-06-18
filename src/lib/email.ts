/**
 * Email merge-tags and rendering. Importable by both client (editor/preview)
 * and server (when wiring an email provider to actually send).
 */

export interface MergeTag {
  tag: string; // e.g. "{{first_name}}"
  key: string; // e.g. "first_name"
  label: string;
  sample: string;
}

export const MERGE_TAGS: MergeTag[] = [
  { tag: "{{first_name}}", key: "first_name", label: "First name", sample: "Alex" },
  { tag: "{{full_name}}", key: "full_name", label: "Full name", sample: "Alex Guru" },
  { tag: "{{email}}", key: "email", label: "Email", sample: "alex@possabilities.org.uk" },
  { tag: "{{role}}", key: "role", label: "Role", sample: "Support Worker" },
  { tag: "{{journey_name}}", key: "journey_name", label: "Course / journey", sample: "PossAbilities Induction" },
  { tag: "{{progress_percent}}", key: "progress_percent", label: "Progress %", sample: "40%" },
  { tag: "{{next_mission}}", key: "next_mission", label: "Next mission", sample: "Our Culture & Values" },
  { tag: "{{due_date}}", key: "due_date", label: "Due date", sample: "30 June 2026" },
  { tag: "{{login_url}}", key: "login_url", label: "Login link", sample: "https://possabilities-induction.netlify.app/login" },
  { tag: "{{company}}", key: "company", label: "Company", sample: "PossAbilities" },
];

/** Sample data used to render previews. */
export const SAMPLE_DATA: Record<string, string> = Object.fromEntries(
  MERGE_TAGS.map((t) => [t.key, t.sample]),
);

/** Replace {{merge_tags}} in a string with provided values (leaves unknown tags as-is). */
export function renderTemplate(
  input: string,
  data: Record<string, string>,
): string {
  return input.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_m, k: string) =>
    k in data ? data[k] : `{{${k}}}`,
  );
}

export const EMAIL_TRIGGERS = [
  { value: "welcome", label: "Welcome (on invite/first login)" },
  { value: "reminder", label: "Reminder (stalled progress)" },
  { value: "completion", label: "Completion (certificate earned)" },
  { value: "custom", label: "Custom / manual send" },
] as const;
