import type { Metadata } from "next";
import Link from "next/link";
import { getDeliveries, getIntegrations } from "@/lib/integrations";
import { getInboundEvents, listApiKeys } from "@/lib/inbound";
import { siteUrl } from "@/lib/config";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";
import { IntegrationsManager } from "./IntegrationsManager";
import { InboundPanel } from "./InboundPanel";

export const metadata: Metadata = { title: "Admin · Integrations" };

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const inbound = view === "inbound";

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black text-on-surface">Integrations</h1>
      <p className="mt-1 max-w-2xl text-on-surface-variant">
        Connect the platform to your other systems — send data out when events
        happen, and let other systems push data in.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-outline-variant/50 pb-3">
        {[
          { key: "", label: "Outbound (events → APIs)", icon: "north_east" },
          { key: "inbound", label: "Inbound (APIs → platform)", icon: "south_west" },
        ].map((t) => {
          const isActive = (t.key === "inbound") === inbound;
          return (
            <Link
              key={t.key}
              href={t.key ? "/admin/integrations?view=inbound" : "/admin/integrations"}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold",
                isActive
                  ? "bg-secondary text-on-secondary"
                  : "text-on-surface-variant hover:bg-surface-container",
              )}
            >
              <Icon name={t.icon} size={18} />
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {inbound ? <InboundView /> : <OutboundView />}
      </div>
    </div>
  );
}

async function OutboundView() {
  const [integrations, deliveries] = await Promise.all([
    getIntegrations(),
    getDeliveries(30),
  ]);
  return (
    <>
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
        <Icon name="hub" size={20} />
        <span>
          Pick an event (e.g. <code>photo.submitted</code>), point it at any API,
          add auth headers, and map exactly which data goes in the body.
        </span>
      </div>
      <IntegrationsManager integrations={integrations} deliveries={deliveries} />
    </>
  );
}

async function InboundView() {
  const [apiKeys, events] = await Promise.all([
    listApiKeys(),
    getInboundEvents(30),
  ]);
  return <InboundPanel apiKeys={apiKeys} events={events} baseUrl={siteUrl} />;
}
