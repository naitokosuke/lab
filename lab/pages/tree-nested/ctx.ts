import type { InjectionKey, Ref } from "vue";
import type { NodeId } from "../../shared/tree";

export type NestedTreeCtx = {
  readonly openedIds: Ref<Set<NodeId>>;
  readonly selectedId: Ref<NodeId | null>;
  readonly toggle: (id: NodeId) => void;
  readonly select: (id: NodeId) => void;
};

export const nestedCtxKey: InjectionKey<NestedTreeCtx> = Symbol("tree-nested-ctx");
