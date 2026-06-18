import { NextResponse, type NextRequest } from "next/server";
import {
  logInbound,
  upsertStarterInbound,
  validateApiKey,
} from "@/lib/inbound";

export const dynamic = "force-dynamic";
const ENDPOINT = "/api/inbound/starters";

function presentedKey(req: NextRequest): string | null {
  return (
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null
  );
}

/**
 * Inbound webhook — let an external system create/update a starter.
 * Auth: `x-api-key: <key>` or `Authorization: Bearer <key>`.
 * Body (JSON): { email (required), full_name?, role?, department?, manager_id?,
 *               badge_status?, metadata?: {} }
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

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    await logInbound(ENDPOINT, false, 422, "Missing/invalid email");
    return NextResponse.json({ error: "A valid 'email' is required" }, { status: 422 });
  }

  const res = await upsertStarterInbound({
    email,
    full_name: body.full_name ? String(body.full_name) : undefined,
    role: body.role ? String(body.role) : undefined,
    department: body.department ? String(body.department) : undefined,
    manager_id: body.manager_id ? String(body.manager_id) : undefined,
    badge_status: body.badge_status ? String(body.badge_status) : undefined,
    metadata:
      body.metadata && typeof body.metadata === "object"
        ? (body.metadata as Record<string, unknown>)
        : undefined,
  });

  const status = res.ok ? 200 : 500;
  await logInbound(ENDPOINT, res.ok, status, `${res.action}: ${email}`);
  return NextResponse.json(res, { status });
}
