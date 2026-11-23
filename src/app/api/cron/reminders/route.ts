import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendStalledReminders } from "@/lib/mailer";
import { purgeExpiredCredentials } from "@/lib/data";
import { sendReferenceReminders } from "@/lib/recruitment-data";

// This endpoint is invoked by the daily Netlify scheduled function. It is
// protected by CRON_SECRET — without a matching secret it refuses to run.
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return false; // must be configured to run
  // Header-only: a secret in the query string (?key=) ends up in access logs,
  // proxy logs and browser history, so it is deliberately not accepted.
  const header = request.headers.get("x-cron-secret") ?? "";
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return safeEqual(header, secret) || safeEqual(bearer, secret);
}

/** Constant-time comparison so the secret can't be guessed from response timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendStalledReminders();
  // Daily housekeeping: purge expired credential-vault entries (30 days post-start).
  let purgedCredentials = 0;
  try {
    purgedCredentials = await purgeExpiredCredentials();
  } catch {
    /* best-effort */
  }
  // Chase referees who haven't returned a reference (every N days, see
  // Admin → Recruitment Setup).
  let referenceReminders: { sent: number; errors: string[] } = { sent: 0, errors: [] };
  try {
    referenceReminders = await sendReferenceReminders();
  } catch (e) {
    referenceReminders.errors.push(e instanceof Error ? e.message : "failed");
  }
  return NextResponse.json(
    { ...result, purgedCredentials, referenceReminders },
    { status: 200 },
  );
}

export async function GET(request: NextRequest) {
  return run(request);
}
export async function POST(request: NextRequest) {
  return run(request);
}
