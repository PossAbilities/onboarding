"use client";

import { useActionState } from "react";
import { signInWithPassword, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signInWithPassword,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-on-surface">Work email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@possabilities.org.uk"
          className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-on-surface">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
        />
      </label>
      {state?.error && (
        <p className="flex items-center gap-1.5 text-sm font-bold text-error">
          <Icon name="error" size={18} /> {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "Signing in…" : "Sign in"}
        <Icon name="arrow_forward" size={20} />
      </Button>
    </form>
  );
}
