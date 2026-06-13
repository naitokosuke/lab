import type { InjectionKey } from "vue";
import type { NodeId } from "../../core";
import type { BiNode } from "./composable";

export type BiTreeCtx = {
  readonly toggle: (id: NodeId) => void;
  readonly select: (id: NodeId) => void;
  readonly filteredChildren: (n: BiNode) => readonly BiNode[];
};

export const biCtxKey: InjectionKey<BiTreeCtx> = Symbol("tree-bidirectional-ctx");
