import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function TaskHeader({
  title,
  explained,
  icon,
}: {
  title: string;
  explained: string;
  icon: string;
}) {
  return (
    <div>
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1 text-sm font-bold text-secondary"
      >
        <Icon name="arrow_back" size={18} /> Back to onboarding
      </Link>
      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-purple-pink text-on-primary">
          <Icon name={icon} size={26} />
        </span>
        <div>
          <h1 className="text-3xl font-black text-on-surface">{title}</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{explained}</p>
        </div>
      </div>
    </div>
  );
}
