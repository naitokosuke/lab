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
  "/tree-nested/": {
    title: "Tree — Nested",
    description: "Recursive component, children-only data shape (baseline)",
    tags: ["tree", "basics"],
  },
  "/tree-bidirectional/": {
    title: "Tree — Bidirectional",
    description: "Parent backref + identity-preserving refresh",
    tags: ["tree", "reactivity"],
  },
  "/tree-normalized/": {
    title: "Tree — Normalized",
    description: "Entity graph with DAG support (multi-parent nodes)",
    tags: ["tree", "reactivity"],
  },
  "/tree-flat-virtual/": {
    title: "Tree — Flat + Virtual",
    description: "Flattened list with depth, virtual scrolling for 10k+ nodes",
    tags: ["tree", "performance"],
  },
  "/tree-headless/": {
    title: "Tree — Headless",
    description: "Vuetify 0 compound components, DOM-driven hierarchy",
    tags: ["tree", "a11y"],
  },
} as const satisfies Record<LabRouteName, LabPageMeta>;
