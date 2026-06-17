"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { clsx } from "@/lib/cn";
import { submitIdeaAction, voteIdeaAction } from "@/app/actions/journey";
import type { Idea } from "@/lib/types";

const CATEGORIES = ["Operations", "People", "Sustainability", "Wellbeing", "Tech"];

const STATUS_TONE: Record<string, "teal" | "pink" | "purple" | "success"> = {
  implemented: "success",
  popular: "pink",
  reviewing: "purple",
  submitted: "teal",
};

export function IdeaPortal({ initialIdeas }: { initialIdeas: Idea[] }) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [voted, setVoted] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const vote = (id: string) => {
    if (voted.includes(id)) return;
    setVoted((v) => [...v, id]);
    setIdeas((list) =>
      list
        .map((i) => (i.id === id ? { ...i, votes: i.votes + 1 } : i))
        .sort((a, b) => b.votes - a.votes),
    );
    startTransition(() => voteIdeaAction(id));
  };

  const submit = () => {
    if (!title.trim() || !description.trim()) {
      setMsg("Please add a title and a description.");
      return;
    }
    startTransition(async () => {
      const res = await submitIdeaAction({ title, description, category });
      if (res.ok && res.idea) {
        setIdeas((list) => [res.idea!, ...list]);
        setTitle("");
        setDescription("");
        setOpen(false);
        setMsg("🚀 Idea submitted! You earned the Pioneer badge.");
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg(res.message ?? "Something went wrong.");
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-black text-on-surface">
          <Icon name="forum" className="text-secondary" fill /> Latest Innovations
        </h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
        >
          <Icon name="add" size={20} /> Submit New Idea
        </button>
      </div>

      {msg && (
        <p className="mt-3 rounded-lg bg-secondary-fixed px-4 py-2 text-sm font-bold text-on-secondary-fixed-variant">
          {msg}
        </p>
      )}

      {open && (
        <div className="mt-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow float-in">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your idea in one line…"
            className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 font-bold text-on-surface"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more. What problem does it solve?"
            rows={3}
            className="field-focus mt-3 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                  category === c
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn-3d rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
            >
              {pending ? "Submitting…" : "Submit idea"}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-5 flex flex-col gap-3">
        {ideas.map((idea) => (
          <li
            key={idea.id}
            className="flex gap-4 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 journey-card-hover"
          >
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => vote(idea.id)}
                className={clsx(
                  "flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 font-black transition-colors",
                  voted.includes(idea.id)
                    ? "border-secondary bg-secondary text-on-secondary"
                    : "border-outline-variant text-on-surface hover:border-secondary",
                )}
                aria-label="Upvote"
              >
                <Icon name="arrow_upward" size={18} />
                <span className="text-xs tabular-nums">{idea.votes}</span>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={STATUS_TONE[idea.status] ?? "teal"}>{idea.status}</Chip>
                <Chip tone="neutral">{idea.category}</Chip>
              </div>
              <p className="mt-2 font-extrabold text-on-surface">{idea.title}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {idea.description}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                <Avatar src={idea.authorAvatar} name={idea.authorName} size={20} />
                {idea.authorName}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
