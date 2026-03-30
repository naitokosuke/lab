import * as v from "valibot";
import type { RouteNamedMap } from "vue-router/auto-routes";

export const LabTag = v.picklist(["basics", "reactivity", "svg", "animation", "text"]);
export type LabTag = v.InferOutput<typeof LabTag>;

export const LabPageMeta = v.object({
  title: v.string(),
  description: v.string(),
  tags: v.array(LabTag),
});
export type LabPageMeta = v.InferOutput<typeof LabPageMeta>;

type LabRouteName = Exclude<
  keyof RouteNamedMap,
  "/" | "/meter-circular/component" | "/pretext/component"
>;

export const labPages = {
  "/counter": {
    title: "Counter",
    description: "Naive counter example",
    tags: ["basics", "reactivity"],
  },
  "/meter-circular/": {
    title: "Meter Circular",
    description: "SVG-based circular meter",
    tags: ["svg", "animation"],
  },
  "/pretext/": {
    title: "Pretext",
    description: "Text measurement & layout without DOM reflow",
    tags: ["text"],
  },
} as const satisfies Record<LabRouteName, LabPageMeta>;
