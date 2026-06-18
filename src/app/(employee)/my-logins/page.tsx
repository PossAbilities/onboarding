import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { listMyCredentials } from "@/lib/data";
import { CredentialVault } from "./CredentialVault";

export const metadata: Metadata = { title: "My Logins" };

export default async function MyLoginsPage() {
  const profile = await requireProfile();
  const credentials = await listMyCredentials(profile);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">My Logins</h1>
      <p className="mt-2 max-w-xl text-on-surface-variant">
        Getting set up means a lot of new accounts. Keep your sign-ins for the
        systems you use in one secure place while you settle in.
      </p>

      <div className="mt-6">
        <CredentialVault items={credentials} />
      </div>
    </div>
  );
}
