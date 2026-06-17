"use client";

import { demoLogin } from "@/app/actions/auth";
import { Icon } from "@/components/ui/Icon";

export function DemoLogin() {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => demoLogin("employee")}
        className="btn-3d flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-4 text-base font-bold text-on-secondary"
      >
        <Icon name="rocket_launch" size={20} /> Enter as a New Starter
      </button>
      <button
        type="button"
        onClick={() => demoLogin("admin")}
        className="btn-3d-purple flex items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-4 text-base font-bold text-on-primary"
      >
        <Icon name="admin_panel_settings" size={20} /> Enter as an Admin
      </button>
    </div>
  );
}
