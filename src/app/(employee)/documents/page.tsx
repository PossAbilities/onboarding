import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getDocuments, getMySignatures } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DocumentSigner } from "@/components/documents/DocumentSigner";

export const metadata: Metadata = { title: "Documents to sign" };

export default async function DocumentsPage() {
  const profile = await requireProfile();
  const [docs, sigs] = await Promise.all([
    getDocuments(),
    getMySignatures(profile.id),
  ]);
  const signedBy = new Map(sigs.map((s) => [s.documentId, s]));
  const requiredDocs = docs.filter((d) => d.required);
  const signedRequired = requiredDocs.filter((d) => signedBy.has(d.id)).length;
  const allDone = requiredDocs.length > 0 && signedRequired === requiredDocs.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Documents to sign
      </h1>
      <p className="mt-2 max-w-xl text-on-surface-variant">
        Please read and digitally sign each document below. Your signature is
        recorded with the date and time, just like signing on paper.
      </p>

      {requiredDocs.length > 0 && (
        <div className="mt-6 rounded-xl bg-surface-container-lowest p-5 journey-card-shadow">
          <div className="flex items-center justify-between">
            <span className="font-bold text-on-surface">
              {allDone ? "All required documents signed 🎉" : "Signing progress"}
            </span>
            <span className="font-black text-primary-container">
              {signedRequired}/{requiredDocs.length}
            </span>
          </div>
          <ProgressBar
            value={Math.round((signedRequired / requiredDocs.length) * 100)}
            className="mt-2"
          />
        </div>
      )}

      {docs.length === 0 ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-tertiary-fixed bg-tertiary-fixed/40 p-5 text-on-tertiary-fixed-variant">
          <Icon name="task_alt" size={22} />
          No documents to sign right now — you&rsquo;re all caught up.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {docs.map((doc) => (
            <DocumentSigner
              key={doc.id}
              doc={doc}
              signature={signedBy.get(doc.id) ?? null}
              defaultName={profile.fullName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
