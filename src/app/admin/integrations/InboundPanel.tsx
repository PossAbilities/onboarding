"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { createApiKeyAction, revokeApiKeyAction } from "@/app/actions/admin";
import type { ApiKey, InboundEvent } from "@/lib/types";

export function InboundPanel({
  apiKeys: initial,
  events,
  baseUrl,
}: {
  apiKeys: ApiKey[];
  events: InboundEvent[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const endpoint = `${baseUrl}/api/inbound/starters`;
  const example = `curl -X POST ${endpoint} \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "j.rivera@possabilities.org.uk",
    "full_name": "Jamie Rivera",
    "role": "Support Worker",
    "department": "Supported Living",
    "badge_status": "printed"
  }'`;

  const create = () =>
    startTransition(async () => {
      const { key } = await createApiKeyAction(name || "API key");
      setKeys((k) => [key, ...k]);
      setRevealed(key.key);
      setName("");
      router.refresh();
    });

  const revoke = (id: string) => {
    if (!confirm("Revoke this key? Systems using it will stop working.")) return;
    startTransition(async () => {
      await revokeApiKeyAction(id);
      setKeys((k) => k.map((x) => (x.id === id ? { ...x, revoked: true } : x)));
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {/* Endpoint docs */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
          <h3 className="flex items-center gap-2 text-lg font-black text-on-surface">
            <Icon name="login" className="text-secondary" fill /> Incoming endpoint
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            External systems POST here to create or update a starter (matched by
            email). Set <code className="font-mono">badge_status</code> or any{" "}
            <code className="font-mono">metadata</code> field — e.g. a task system
            calling in when a badge is printed.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
            <Chip tone="pink">POST</Chip>
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-on-surface">
              {endpoint}
            </code>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#1e1b1c] p-4 font-mono text-xs leading-relaxed text-[#f8efef]">
            {example}
          </pre>
          <p className="mt-2 text-xs text-on-surface-variant">
            Auth: header <code className="font-mono">x-api-key: &lt;key&gt;</code>{" "}
            (or <code className="font-mono">Authorization: Bearer &lt;key&gt;</code>).
          </p>
        </div>

        {/* API keys */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
          <h3 className="text-lg font-black text-on-surface">API keys</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Generate a key for each system you connect. Copy it now — for security
            it&rsquo;s only shown once.
          </p>

          {revealed && (
            <div className="mt-3 rounded-lg border border-success-green/40 bg-success-green/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#1b7a44]">
                New key — copy it now
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate font-mono text-sm text-on-surface">
                  {revealed}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(revealed);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-on-secondary"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name (e.g. Task system)"
              className="field-focus min-w-0 flex-1 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={create}
              disabled={pending}
              className="btn-3d inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary"
            >
              <Icon name="key" size={18} /> Generate
            </button>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center gap-3 rounded-lg border border-outline-variant/60 px-3 py-2.5"
              >
                <Icon name="vpn_key" className="text-on-surface-variant" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-on-surface">{k.name}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    Added {new Date(k.createdAt).toLocaleDateString("en-GB")}
                    {k.lastUsedAt
                      ? ` · last used ${new Date(k.lastUsedAt).toLocaleString("en-GB")}`
                      : " · never used"}
                  </p>
                </div>
                {k.revoked ? (
                  <Chip tone="locked">Revoked</Chip>
                ) : (
                  <button
                    type="button"
                    onClick={() => revoke(k.id)}
                    className="text-sm font-bold text-error hover:underline"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
            {keys.length === 0 && (
              <li className="rounded-lg border border-dashed border-outline-variant px-3 py-4 text-center text-sm text-on-surface-variant">
                No keys yet — generate one to connect a system.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Inbound log */}
      <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 journey-card-shadow">
        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          Recent inbound calls
        </p>
        {events.length === 0 ? (
          <p className="px-2 py-2 text-xs text-on-surface-variant">
            No inbound calls yet.
          </p>
        ) : (
          <ul className="mt-1 flex max-h-[420px] flex-col gap-1 overflow-y-auto">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs">
                <Icon
                  name={e.ok ? "check_circle" : "error"}
                  size={16}
                  className={e.ok ? "text-success-green" : "text-error"}
                  fill
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-on-surface">
                    {e.summary}
                  </span>
                  <span className="block truncate text-on-surface-variant">
                    HTTP {e.status} · {new Date(e.createdAt).toLocaleString("en-GB")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
