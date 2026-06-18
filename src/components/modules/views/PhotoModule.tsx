import { ModuleScaffold } from "../ModuleScaffold";
import { PhotoCapture } from "../PhotoCapture";
import type { ModuleViewProps } from "../types";

export function PhotoModule(props: ModuleViewProps) {
  return (
    <ModuleScaffold {...props}>
      <PhotoCapture
        moduleId={props.module.id}
        name={props.profile.fullName}
        role={props.profile.roleTag}
        department={props.profile.department}
        currentPhoto={props.profile.avatarUrl}
      />
    </ModuleScaffold>
  );
}
