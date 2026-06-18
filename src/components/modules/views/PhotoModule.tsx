import { ModuleScaffold } from "../ModuleScaffold";
import { PhotoCapture } from "../PhotoCapture";
import { getOffices } from "@/lib/data";
import type { ModuleViewProps } from "../types";

export async function PhotoModule(props: ModuleViewProps) {
  const offices = await getOffices();
  return (
    <ModuleScaffold {...props}>
      <PhotoCapture
        moduleId={props.module.id}
        name={props.profile.fullName}
        role={props.profile.roleTag}
        department={props.profile.department}
        currentPhoto={props.profile.avatarUrl}
        offices={offices}
      />
    </ModuleScaffold>
  );
}
