import * as v from "valibot";
import type { RouteNamedMap } from "vue-router/auto-routes";

export const LabTag = v.picklist([
  "basics",
  "reactivity",
  "svg",
  "animation",
  "text",
  "tree",
  "performance",
  "a11y",
]);
export type LabTag = v.InferOutput<typeof LabTag>;

export const LabPageMeta = v.object({
  title: v.string(),
  description: v.string(),
  tags: v.array(LabTag),
});
export type LabPageMeta = v.InferOutput<typeof LabPageMeta>;

type LabRouteName = Exclude<keyof RouteNamedMap, "/">;

export const labPages = {
  "/counter/": {
    title: "Counter",
    description: "Naive counter example",
    tags: ["basics", "reactivity"],
  },
  "/dock/": {
    title: "Dock",
    description: "A glass dock that magnifies under the mouse, with a sliding current-item dot",
    tags: ["animation"],
  },
  "/meter-circular/": {
    title: "Meter Circular",
    description: "SVG-based circular meter",
    tags: ["svg", "animation"],
  },
  "/pretext/": {
    title: "Pretext",
    description: "Interactive editorial layout — text reflows around draggable obstacles",
    tags: ["text", "animation"],
  },
  "/segmented/": {
    title: "Segmented",
    description: "Segmented control and tab list with an indicator that slides and stretches",
    tags: ["animation", "a11y"],
  },
  "/swipe-row/": {
    title: "Swipe Row",
    description: "A list row a finger slides aside to show its trailing actions",
    tags: ["animation", "a11y"],
  },
  "/text-morph/": {
    title: "Text Morph",
    description: "Text that morphs: shared characters slide, the rest fade out and in",
    tags: ["text", "animation"],
  },
  "/tree/": {
    title: "Tree",
    description: "Compare tree-rendering strategies (nested / normalized / virtual / headless)",
    tags: ["tree", "reactivity", "performance", "a11y"],
  },
} as const satisfies Record<LabRouteName, LabPageMeta>;
