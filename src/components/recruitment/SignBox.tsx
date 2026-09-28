"use client";

import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  SignaturePad,
  type SignaturePadHandle,
} from "@/components/documents/SignaturePad";
import type { Signature } from "@/lib/recruitment";

/** Draw + type-your-name e-signature, or the recorded signature once signed. */
export function SignBox({
  defaultName,
  signature,
  onSign,
  buttonLabel = "Sign",
  agreeText = "I confirm I have read this document and that the drawn signature and typed name above are my legally binding electronic signature.",
  preview = false,
}: {
  defaultName: string;
  signature: Signature | null;
  onSign: (
    name: string,
    data: string | null,
  ) => Promise<{ ok: boolean; message: string }>;
  buttonLabel?: string;
  agreeText?: string;
  preview?: boolean;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [name, setName] = useState(defaultName);
  const [agreed, setAgreed] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (signature) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-success-green/10 p-4">
        {signature.signatureData && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={signature.signatureData}
            alt="Your signature"
            className="h-16 rounded bg-white px-2"
          />
        )}
        <div>
          <p className="flex items-center gap-1.5 font-bold text-[#1b7a44]">
            <Icon name="verified" size={18} fill /> Signed by{" "}
            {signature.signedName}
          </p>
          <p className="text-sm text-on-surface-variant">
            {new Date(signature.signedAt).toLocaleString("en-GB")}
          </p>
        </div>
      </div>
    );
  }

  const sign = () => {
    setError(null);
    if (preview) return setError("Admin preview — candidates sign here.");
    if (!name.trim()) return setError("Please type your full name.");
    if (!agreed) return setError("Please tick the box to agree.");
    if (padRef.current?.isEmpty())
      return setError("Please draw your signature.");
    const data = padRef.current?.toDataURL() ?? null;
    startTransition(async () => {
      const res = await onSign(name, data);
      if (!res.ok) setError(res.message);
    });
  };

  return (
    <div>
      <p className="text-sm font-bold text-on-surface">Your signature</p>
      <div className="mt-2">
        <SignaturePad
          ref={padRef}
          onChange={() => setHasInk(!padRef.current?.isEmpty())}
        />
      </div>
      <label className="mt-3 block text-sm font-bold text-on-surface">
        Full legal name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
        />
      </label>
      <label className="mt-3 flex items-start gap-3 rounded-lg bg-surface-container-low px-3 py-3 text-sm text-on-surface">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[#b30069]"
        />
        {agreeText}
      </label>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-error">
          <Icon name="error" size={18} /> {error}
        </p>
      )}
      <button
        type="button"
        onClick={sign}
        disabled={pending || (!preview && (!agreed || !name.trim() || !hasInk))}
        className="btn-3d mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
      >
        <Icon name="draw" size={20} /> {pending ? "Signing…" : buttonLabel}
      </button>
    </div>
  );
}
