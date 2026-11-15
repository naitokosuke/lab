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
  "audio",
]);
export type LabTag = v.InferOutput<typeof LabTag>;

/** How a page is framed: a centred column of that width, or the whole viewport to itself */
export const LabLayout = v.picklist(["narrow", "medium", "wide", "fullscreen"]);
export type LabLayout = v.InferOutput<typeof LabLayout>;

export const LabPageMeta = v.object({
  title: v.string(),
  description: v.string(),
  tags: v.array(LabTag),
  layout: LabLayout,
});
export type LabPageMeta = v.InferOutput<typeof LabPageMeta>;

type LabRouteName = Exclude<keyof RouteNamedMap, "/">;

export const labPages = {
  "/audio-analyzer/": {
    title: "Audio Analyzer",
    description: "Live spectrum and waveform of a tone, the microphone, or a file via AnalyserNode",
    tags: ["audio"],
    layout: "wide",
  },
  "/counter/": {
    title: "Counter",
    description: "Naive counter example",
    tags: ["basics", "reactivity"],
    layout: "wide",
  },
  "/dock/": {
    title: "Dock",
    description: "A glass dock that magnifies under the mouse, with a sliding current-item dot",
    tags: ["animation"],
    layout: "wide",
  },
  "/meter-circular/": {
    title: "Meter Circular",
    description: "SVG-based circular meter",
    tags: ["svg", "animation"],
    layout: "narrow",
  },
  "/pretext/": {
    title: "Pretext",
    description: "Interactive editorial layout — text reflows around draggable obstacles",
    tags: ["text", "animation"],
    layout: "fullscreen",
  },
  "/segmented/": {
    title: "Segmented",
    description: "Segmented control and tab list with an indicator that slides and stretches",
    tags: ["animation", "a11y"],
    layout: "medium",
  },
  "/swipe-row/": {
    title: "Swipe Row",
    description: "A list row a finger slides aside to show its trailing actions",
    tags: ["animation", "a11y"],
    layout: "medium",
  },
  "/text-morph/": {
    title: "Text Morph",
    description: "Text that morphs: shared characters slide, the rest fade out and in",
    tags: ["text", "animation"],
    layout: "medium",
  },
  "/tree/": {
    title: "Tree",
    description: "Compare tree-rendering strategies (nested / normalized / virtual / headless)",
    tags: ["tree", "reactivity", "performance", "a11y"],
    layout: "fullscreen",
  },
} as const satisfies Record<LabRouteName, LabPageMeta>;

/** The meta of the lab page a route shows, if it is one (the home page is not) */
export const labPageOf = (name: keyof RouteNamedMap): LabPageMeta | undefined =>
  name === "/" ? undefined : labPages[name];
