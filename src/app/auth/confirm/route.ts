import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Handles Supabase email links (invite, magic link, recovery). Exchanges the
 * code / token for a session, then sends the user on to set their password.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/accept-invite";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalid`);
}
