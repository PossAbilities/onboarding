import type { Metadata } from "next";
import { getDeliveries, getIntegrations } from "@/lib/integrations";
import { Icon } from "@/components/ui/Icon";
import { IntegrationsManager } from "./IntegrationsManager";

export const metadata: Metadata = { title: "Admin · Integrations" };

export default async function IntegrationsPage() {
  const [integrations, deliveries] = await Promise.all([
    getIntegrations(),
    getDeliveries(30),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-black text-on-surface">Integrations</h1>
      <p className="mt-1 max-w-2xl text-on-surface-variant">
        Connect the platform to your other systems. Pick an event (e.g. a profile
        photo is submitted), point it at any API endpoint, add your auth headers,
        and map exactly which data goes into the request body. Add as many as you
        need as the platform grows.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
        <Icon name="hub" size={20} />
        <span>
          <strong>Example:</strong> on <code>photo.submitted</code>, POST the
          name, role and photo URL to your task system to auto-create an ID-badge
          task. Use <strong>Send test</strong> to fire sample data and check the
          response.
        </span>
      </div>

      <div className="mt-6">
        <IntegrationsManager integrations={integrations} deliveries={deliveries} />
      </div>
    </div>
  );
}
