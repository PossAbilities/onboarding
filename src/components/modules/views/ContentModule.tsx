/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { ModuleVideo } from "../ModuleVideo";
import type { ModuleViewProps } from "../types";

const isVideo = (url: string) =>
  /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.startsWith("data:video");

/**
 * Generic content mission: an optional hero (native video or image) plus the
 * module's rich content blocks (headings, paragraphs, quotes, lists, galleries),
 * which ModuleScaffold renders. Powers PossCars, Positive Recognition, the
 * closing welcome video, and any custom "Rich content" mission.
 */
export function ContentModule(props: ModuleViewProps) {
  const { heroMediaUrl, heroPoster } = props.module;
  const hero = heroMediaUrl ? (
    isVideo(heroMediaUrl) ? (
      <ModuleVideo
        moduleId={props.module.id}
        src={heroMediaUrl}
        poster={heroPoster}
        label="Press play"
        alreadyCompleted={props.alreadyCompleted}
      />
    ) : (
      <img
        src={heroMediaUrl}
        alt=""
        className="w-full rounded-lg object-cover"
        style={{ aspectRatio: "16/9" }}
      />
    )
  ) : undefined;

  return <ModuleScaffold {...props} hero={hero} />;
}
