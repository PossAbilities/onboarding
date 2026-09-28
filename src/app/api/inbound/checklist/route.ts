import { NextResponse, type NextRequest } from "next/server";
import { logInbound, validateApiKey } from "@/lib/inbound";
import { setCheckByEmail } from "@/lib/recruitment-data";
import { API_CHECK_KEYS, type ChecklistKey } from "@/lib/recruitment";

export const dynamic = "force-dynamic";
const ENDPOINT = "/api/inbound/checklist";

function presentedKey(req: NextRequest): string | null {
  return (
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null
  );
}

/**
 * Inbound webhook — let Ucheck / Occupational Health (or a connector) tick a
 * candidate's DBS or health checklist items.
 * Auth: `x-api-key: <key>` or `Authorization: Bearer <key>`.
 * Body (JSON): { email, item: "dbs_application" | "dbs_complete" |
 *               "health_questionnaire" | "health_clearance", done?: boolean,
 *               source?: string }
 */
export async function POST(req: NextRequest) {
  if (!(await validateApiKey(presentedKey(req)))) {
    await logInbound(ENDPOINT, false, 401, "Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    await logInbound(ENDPOINT, false, 400, "Invalid JSON");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const item = String(body.item ?? "") as ChecklistKey;
  if (!email.includes("@") || !API_CHECK_KEYS.includes(item)) {
    await logInbound(ENDPOINT, false, 422, "Missing email or unknown item");
    return NextResponse.json(
      {
        error: `'email' and 'item' (one of ${API_CHECK_KEYS.join(", ")}) are required`,
      },
      { status: 422 },
    );
  }
  const done =
    body.done === undefined ? true : body.done === true || body.done === "true";
  const source = String(body.source ?? "API").slice(0, 60) || "API";

  const res = await setCheckByEmail(email, item, done, source);
  const status = res.ok ? 200 : 404;
  await logInbound(ENDPOINT, res.ok, status, `${item}=${done}: ${email}`);
  return NextResponse.json(res, { status });
}
