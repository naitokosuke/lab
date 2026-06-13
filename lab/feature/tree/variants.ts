import type { Component } from "vue";
import Nested from "./variants/nested/component.vue";
import Bidirectional from "./variants/bidirectional/component.vue";
import Normalized from "./variants/normalized/component.vue";
import FlatVirtual from "./variants/flat-virtual/component.vue";
import Headless from "./variants/headless/component.vue";

export type TreeVariantId = "nested" | "bidirectional" | "normalized" | "flat-virtual" | "headless";

export type TreeVariant = {
  id: TreeVariantId;
  label: string;
  description: string;
  component: Component;
};

export const treeVariants: ReadonlyArray<TreeVariant> = [
  {
    id: "nested",
    label: "Nested",
    description: "Recursive component, children-only data shape (baseline)",
    component: Nested,
  },
  {
    id: "bidirectional",
    label: "Bidirectional",
    description: "Parent backref + identity-preserving refresh",
    component: Bidirectional,
  },
  {
    id: "normalized",
    label: "Normalized",
    description: "Entity graph with DAG support (multi-parent nodes)",
    component: Normalized,
  },
  {
    id: "flat-virtual",
    label: "Flat + Virtual",
    description: "Flattened list with depth, virtual scrolling for 10k+ nodes",
    component: FlatVirtual,
  },
  {
    id: "headless",
    label: "Headless",
    description: "Vuetify 0 compound components, DOM-driven hierarchy",
    component: Headless,
  },
];
