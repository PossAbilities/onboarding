import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next 16 "Proxy" (formerly Middleware). Two jobs:
 *  1. Keep the Supabase auth session cookie fresh on every navigation.
 *  2. Optimistic route protection — bounce signed-out users away from the app
 *     and signed-in users away from /login. (Authorisation is still enforced
 *     server-side in each page via requireProfile / requireAdmin.)
 *
 * When Supabase isn't configured we fall back to the demo cookie.
 */
const PUBLIC_PATHS = ["/login", "/accept-invite", "/auth", "/api/cron"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const isConfigured = url.length > 0 && anon.length > 0;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  let response = NextResponse.next({ request });

  let isAuthed = false;

  if (isConfigured) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthed = !!user;
  } else {
    isAuthed = !!request.cookies.get("poss_demo_role")?.value;
  }

  if (!isAuthed && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if (isAuthed && pathname === "/login") {
    return NextResponse.redirect(new URL("/journey", request.url));
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)"],
};
