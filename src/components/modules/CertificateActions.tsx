"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function CertificateActions({ employeeName }: { employeeName: string }) {
  const [shared, setShared] = useState(false);

  const download = () => window.print();

  const share = async () => {
    const data = {
      title: "PossAbilities Induction Certificate",
      text: `${employeeName} completed the PossAbilities induction journey! 🎉`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={download}
        className="btn-3d inline-flex items-center gap-2 rounded-xl bg-teal-accent px-5 py-3 text-sm font-bold text-tertiary"
      >
        <Icon name="download" size={20} /> Download PDF
      </button>
      <button
        type="button"
        onClick={share}
        className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
      >
        <Icon name="share" size={20} /> {shared ? "Link copied!" : "Share Achievement"}
      </button>
    </div>
  );
}
