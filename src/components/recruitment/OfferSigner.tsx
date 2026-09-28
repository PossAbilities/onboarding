"use client";

import { useRouter } from "next/navigation";
import { Confetti } from "./Confetti";
import { SignBox } from "./SignBox";
import { signOfferAction } from "@/app/actions/recruitment";
import type { Signature } from "@/lib/recruitment";

/** Confetti over the offer letter, then sign → home page. */
export function OfferSigner({
  defaultName,
  signature,
  preview,
}: {
  defaultName: string;
  signature: Signature | null;
  preview: boolean;
}) {
  const router = useRouter();
  return (
    <>
      {!signature && <Confetti />}
      <SignBox
        defaultName={defaultName}
        signature={signature}
        preview={preview}
        buttonLabel="Sign & accept my offer"
        agreeText="I accept this conditional offer of employment, and confirm the drawn signature and typed name above are my legally binding electronic signature."
        onSign={async (name, data) => {
          const res = await signOfferAction(name, data);
          if (res.ok) router.push("/home");
          return res;
        }}
      />
    </>
  );
}
