import { Icon } from "@/components/ui/Icon";
import type { ContentBlock } from "@/lib/types";

/**
 * Renders a module's editable rich-content blocks. Admins add/edit/reorder
 * these in the Journey Content editor, and they appear here on the module page.
 */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks?.length) return null;
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={i} className="text-2xl font-black text-on-surface">
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={i} className="text-on-surface-variant leading-relaxed">
                {block.text}
              </p>
            );
          case "quote":
            return (
              <figure
                key={i}
                className="rounded-xl bg-primary-container p-5 text-on-primary"
              >
                <Icon
                  name="format_quote"
                  className="text-inverse-primary"
                  size={28}
                  fill
                />
                <blockquote className="mt-1 text-lg font-bold">
                  {block.text}
                </blockquote>
                {block.author && (
                  <figcaption className="mt-2 text-sm text-primary-fixed">
                    — {block.author}
                  </figcaption>
                )}
              </figure>
            );
          case "list":
            return (
              <ul key={i} className="flex flex-col gap-2">
                {(block.items ?? []).map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-on-surface-variant">
                    <Icon
                      name="check_circle"
                      className="mt-0.5 shrink-0 text-teal-accent"
                      size={20}
                      fill
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-on-tertiary-fixed-variant"
              >
                <Icon name="lightbulb" size={22} fill />
                <p className="text-sm font-bold">{block.text}</p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
