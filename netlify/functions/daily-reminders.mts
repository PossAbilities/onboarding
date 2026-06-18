// Netlify Scheduled Function — runs once a day and triggers the reminder job.
// It simply calls the app's protected /api/cron/reminders route with the shared
// secret, so all the logic lives in one place (and is testable via the route).
//
// Configure the schedule and secret in Netlify:
//   • This file's `config.schedule` controls cadence (default: daily at 09:00 UTC).
//   • Set CRON_SECRET (same value the app uses) in Site settings → Environment.

const handler = async () => {
  const base =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";
  const secret = process.env.CRON_SECRET || "";

  if (!base || !secret) {
    console.log("daily-reminders: missing URL or CRON_SECRET; skipping.");
    return new Response("skipped", { status: 200 });
  }

  const res = await fetch(`${base}/api/cron/reminders`, {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });
  const body = await res.text();
  console.log("daily-reminders:", res.status, body);
  return new Response(body, { status: res.status });
};

export default handler;

// Run every day at 09:00 UTC. Adjust as needed (cron syntax or @daily/@hourly).
export const config = { schedule: "0 9 * * *" };
