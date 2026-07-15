import "server-only";
import { siteUrl } from "./config";
import { sendEmail } from "./mailer";

/**
 * Invite delivery via Resend (not Supabase's built-in auth email).
 *
 * Supabase's `inviteUserByEmail` depends on the project's Auth SMTP being
 * configured, and its magic links redirect through Supabase's own Site-URL /
 * allow-list — which for this project still points at localhost. To avoid both
 * problems we:
 *   1. mint a one-time token with the admin API (`generateLink`),
 *   2. build a link to our OWN `/auth/confirm` route, and
 *   3. send it through Resend (a verified sender for this domain).
 *
 * `/auth/confirm` verifies the token server-side with `verifyOtp`, so we never
 * touch Supabase's redirect configuration.
 */

type OtpType = "invite" | "magiclink";

async function mintConfirmLink(
  email: string,
  metadata: Record<string, unknown>,
): Promise<{ url: string; userId: string | null }> {
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();

  // A brand-new person gets a proper "invite"; someone who already has an
  // (unconfirmed) account can't be invited again, so fall back to a magic link.
  let type: OtpType = "invite";
  let { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: metadata },
  });
  if (error && /(already|exist|registered)/i.test(error.message)) {
    type = "magiclink";
    ({ data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    }));
  }
  if (error) throw new Error(error.message);

  const hashed = data?.properties?.hashed_token;
  if (!hashed) throw new Error("Could not generate a sign-in link.");

  const params = new URLSearchParams({
    token_hash: hashed,
    type,
    next: "/accept-invite",
  });
  return {
    url: `${siteUrl}/auth/confirm?${params.toString()}`,
    userId: data?.user?.id ?? null,
  };
}

function inviteHtml(fullName: string, url: string, isAdmin: boolean): string {
  const firstName = fullName.split(" ")[0] || "there";
  const heading = isAdmin
    ? "You've been given admin access"
    : "You're invited to PossAbilities";
  const lead = isAdmin
    ? "You can now manage the PossAbilities induction platform — starters, content and settings."
    : "Welcome to the team! Your gamified induction journey is ready and waiting.";
  const cta = isAdmin ? "Set your password" : "Start my journey";
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f3f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1b1f;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="background:#48065a;border-radius:16px 16px 0 0;padding:24px 28px;">
        <span style="font-size:22px;font-weight:800;color:#ffffff;">Poss<span style="color:#ec008c;">Abilities</span></span>
      </div>
      <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#48065a;">${heading} 🎉</h1>
        <p style="margin:0 0 4px;font-size:15px;">Hi ${firstName},</p>
        <p style="margin:8px 0 20px;font-size:15px;line-height:1.5;color:#49454f;">${lead}</p>
        <a href="${url}" style="display:inline-block;background:#ec008c;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">${cta} →</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#79747e;">
          If the button doesn't work, paste this link into your browser:<br />
          <a href="${url}" style="color:#48065a;word-break:break-all;">${url}</a>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#aaa;">This link is single-use and will expire. If you weren't expecting it, you can ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Create/refresh the user's sign-in link and email it through Resend.
 * Returns the auth user id (so the caller can upsert their profile row) plus a
 * user-facing status message.
 */
export async function sendInviteEmail(input: {
  email: string;
  fullName: string;
  metadata: Record<string, unknown>;
  isAdmin?: boolean;
}): Promise<{ ok: boolean; message: string; userId: string | null }> {
  const { isEmailConfigured } = await import("./mailer");
  let url: string;
  let userId: string | null;
  try {
    ({ url, userId } = await mintConfirmLink(input.email, input.metadata));
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Could not create the invite.",
      userId: null,
    };
  }

  if (!isEmailConfigured) {
    // The account exists; surface the link so the admin can share it manually.
    return {
      ok: true,
      message: `Account created, but email isn't configured — share this link: ${url}`,
      userId,
    };
  }

  const res = await sendEmail({
    to: input.email,
    subject: input.isAdmin
      ? "You've been given admin access to PossAbilities"
      : "Welcome to PossAbilities — start your induction 🎉",
    html: inviteHtml(input.fullName, url, input.isAdmin ?? false),
  });
  if (!res.ok) {
    return {
      ok: false,
      message: `Account created, but the email failed to send (${res.error}).`,
      userId,
    };
  }
  return {
    ok: true,
    message: `Invitation emailed to ${input.email}.`,
    userId,
  };
}
