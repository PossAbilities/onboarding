"use client";

import { useRouter } from "next/navigation";
import { SignBox } from "./SignBox";
import { signReferencePermissionAction } from "@/app/actions/recruitment";
import type { Signature } from "@/lib/recruitment";

export function PermissionSigner({
  defaultName,
  signature,
}: {
  defaultName: string;
  signature: Signature | null;
}) {
  const router = useRouter();
  return (
    <SignBox
      defaultName={defaultName}
      signature={signature}
      buttonLabel="Sign permission"
      onSign={async (name, data) => {
        const res = await signReferencePermissionAction(name, data);
        if (res.ok) router.refresh();
        return res;
      }}
    />
  );
}
