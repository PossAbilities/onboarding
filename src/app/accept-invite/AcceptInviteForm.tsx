"use client";

import { useActionState } from "react";
import { acceptInvite, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function AcceptInviteForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    acceptInvite,
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-on-surface">Create a password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-on-surface">Confirm password</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3"
        />
      </label>
      {state?.error && (
        <p className="flex items-center gap-1.5 text-sm font-bold text-error">
          <Icon name="error" size={18} /> {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "Setting up…" : "Start my journey"}
        <Icon name="rocket_launch" size={20} />
      </Button>
    </form>
  );
}
