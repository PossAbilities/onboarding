import type { Metadata } from "next";
import { getDocuments, getSignatureCounts } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { DocumentsManager } from "./DocumentsManager";

export const metadata: Metadata = { title: "Admin · Documents" };

export default async function AdminDocumentsPage() {
  const [documents, counts] = await Promise.all([
    getDocuments(),
    getSignatureCounts(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black text-on-surface">Documents to Sign</h1>
      <p className="mt-1 max-w-2xl text-on-surface-variant">
        Upload PDFs or write documents that new starters must digitally sign —
        contracts, policy acknowledgements, handbooks. They sign natively on the
        platform (draw + name + timestamp), and you can see how many have signed.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
        <Icon name="draw" size={20} />
        Starters find these under <strong>Documents</strong> in their menu and on
        their completion (summit) screen.
      </div>

      <div className="mt-6">
        <DocumentsManager documents={documents} counts={counts} />
      </div>
    </div>
  );
}
