"use client";

import { useEffect, useState } from "react";

/**
 * Renders the PossAbilities support email as a clickable mailto link, assembled
 * on the client after mount so the address never appears in the server-rendered
 * HTML.
 *
 * Why: Cloudflare's "Email Address Obfuscation" (Scrape Shield) rewrites any
 * email address / mailto it finds in a page's HTML into a
 * `/cdn-cgi/l/email-protection` link (plus a decoder script). Behind this site's
 * Cloudflare-for-SaaS custom hostname that `/cdn-cgi/` path is not served by
 * Cloudflare and falls through to the app, which 404s. Keeping the address out of
 * the server HTML stops the rewrite, so the link works and the address still
 * shows once hydrated.
 */
export function ContactEmail({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Assembled at runtime so the literal address is not in the server HTML.
  const address = ["digital", "possabilities.org.uk"].join("@");

  if (!mounted) {
    return <span className={className}>the digital team</span>;
  }

  return (
    <a href={`mailto:${address}`} className={className}>
      {address}
    </a>
  );
}
