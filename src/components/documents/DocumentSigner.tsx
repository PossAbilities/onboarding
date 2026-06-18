"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";
import { signDocumentAction } from "@/app/actions/journey";
import type { DocumentSignature, SignDocument } from "@/lib/types";

export function DocumentSigner({
  doc,
  signature,
  defaultName,
}: {
  doc: SignDocument;
  signature: DocumentSignature | null;
  defaultName: string;
}) {
  const router = useRouter();
  const padRef = useRef<SignaturePadHandle>(null);
  const [name, setName] = useState(defaultName);
  const [agreed, setAgreed] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(!signature);

  const signed = !!signature;

  const sign = () => {
    setError(null);
    if (!name.trim()) return setError("Please type your full name.");
    if (!agreed) return setError("Please tick the box to agree.");
    if (padRef.current?.isEmpty()) return setError("Please draw your signature.");
    const data = padRef.current?.toDataURL() ?? null;
    startTransition(async () => {
      const res = await signDocumentAction(doc.id, name, data);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest journey-card-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-on-surface">{doc.title}</h2>
            {doc.required && <Chip tone="pink">Required</Chip>}
            {signed ? (
              <Chip tone="success" icon={<Icon name="verified" size={14} fill />}>
                Signed
              </Chip>
            ) : (
              <Chip tone="locked">Awaiting signature</Chip>
            )}
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{doc.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg px-3 py-2 text-sm font-bold text-secondary hover:bg-surface-container"
        >
          {open ? "Hide" : signed ? "View" : "Open & sign"}
        </button>
      </div>

      {open && (
        <div className="p-5">
          {/* Document content */}
          {doc.fileUrl ? (
            <div className="overflow-hidden rounded-lg border border-outline-variant/50">
              <iframe
                title={doc.title}
                src={doc.fileUrl}
                className="h-[480px] w-full bg-white"
              />
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-surface-container-low px-3 py-2 text-xs font-bold text-secondary"
              >
                <Icon name="open_in_new" size={16} /> Open document in a new tab
              </a>
            </div>
          ) : (
            <div
              className="prose-doc max-h-[420px] overflow-y-auto rounded-lg border border-outline-variant/50 bg-surface-container-low p-5 text-on-surface [&_p]:mb-3 [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: doc.body ?? "" }}
            />
          )}

          {/* Sign / signed */}
          {signed ? (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg bg-success-green/10 p-4">
              {signature?.signatureData && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={signature.signatureData}
                  alt="Your signature"
                  className="h-16 rounded bg-white px-2"
                />
              )}
              <div>
                <p className="font-bold text-[#1b7a44]">
                  Signed by {signature?.signedName}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {signature &&
                    new Date(signature.signedAt).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm font-bold text-on-surface">
                Your signature
              </p>
              <div className="mt-2">
                <SignaturePad ref={padRef} onChange={() => setHasInk(!padRef.current?.isEmpty())} />
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
                I confirm I have read this document and that the drawn signature
                and typed name above are my legally binding electronic signature.
              </label>
              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-error">
                  <Icon name="error" size={18} /> {error}
                </p>
              )}
              <button
                type="button"
                onClick={sign}
                disabled={pending || !agreed || !name.trim() || !hasInk}
                className="btn-3d mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
              >
                <Icon name="draw" size={20} /> {pending ? "Signing…" : "Sign document"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
