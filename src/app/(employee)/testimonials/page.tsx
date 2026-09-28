import type { Metadata } from "next";
import { getTestimonials } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Testimonials
      </h1>
      <p className="mt-2 max-w-2xl text-on-surface-variant">
        What our team, and the people and families we support, say about
        PossAbilities.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 journey-card-shadow"
          >
            <Icon
              name="format_quote"
              size={36}
              className="text-secondary"
              fill
            />
            <blockquote className="mt-2 flex-1 text-lg font-bold leading-relaxed text-on-surface">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar src={t.photoUrl || null} name={t.name} size={44} />
              <div>
                <p className="font-extrabold text-on-surface">{t.name}</p>
                <p className="text-sm text-on-surface-variant">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
