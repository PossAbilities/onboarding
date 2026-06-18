import { NextResponse, type NextRequest } from "next/server";
import { sendStalledReminders } from "@/lib/mailer";

// This endpoint is invoked by the daily Netlify scheduled function. It is
// protected by CRON_SECRET — without a matching secret it refuses to run.
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return false; // must be configured to run
  const header = request.headers.get("x-cron-secret");
  const query = request.nextUrl.searchParams.get("key");
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");
  return header === secret || query === secret || bearer === secret;
}

async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendStalledReminders();
  return NextResponse.json(result, { status: result.ok ? 200 : 200 });
}

export async function GET(request: NextRequest) {
  return run(request);
}
export async function POST(request: NextRequest) {
  return run(request);
}
