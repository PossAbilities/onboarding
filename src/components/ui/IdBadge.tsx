/* eslint-disable @next/next/no-img-element */
import { Logo } from "./Logo";
import { Icon } from "./Icon";

/** A branded staff ID badge preview using the starter's uploaded photo. */
export function IdBadge({
  name,
  role,
  department,
  photoUrl,
  serial,
}: {
  name: string;
  role: string;
  department?: string | null;
  photoUrl: string | null;
  serial?: string;
}) {
  return (
    <div className="w-56 overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-xl">
      <div className="gradient-purple-pink px-4 py-3 text-center">
        <Logo size="text-lg" href={null} className="text-on-primary [&_*]:text-on-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed">
          Staff Identification
        </p>
      </div>
      <div className="flex flex-col items-center px-4 pb-4 pt-3">
        <div className="h-32 w-26 overflow-hidden rounded-lg border-2 border-outline-variant/40 bg-surface-container-high" style={{ width: 104, height: 130 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-outline">
              <Icon name="account_circle" size={48} />
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-base font-black leading-tight text-on-surface">
          {name}
        </p>
        <p className="text-center text-xs font-bold text-secondary">{role}</p>
        {department && (
          <p className="text-center text-[11px] text-on-surface-variant">{department}</p>
        )}
        <div className="mt-3 flex w-full items-center justify-between border-t border-outline-variant/40 pt-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">
            PossAbilities CIC
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant">
            {serial ?? "PA-0000"}
          </span>
        </div>
        <div className="mt-1 flex h-4 w-full items-end gap-px overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="bg-on-surface"
              style={{ width: 2, height: i % 3 === 0 ? "100%" : i % 2 ? "70%" : "85%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
