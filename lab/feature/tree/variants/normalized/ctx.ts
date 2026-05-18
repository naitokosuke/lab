import type { InjectionKey, Ref } from "vue";
import type { NodeId } from "../../shared/tree";

export type NormalizedTreeCtx = {
  readonly openedIds: Ref<Set<NodeId>>;
  readonly selectedAppearance: Ref<{ id: NodeId; path: readonly NodeId[] } | null>;
  readonly matchedIds: Ref<Set<NodeId> | null>;
  readonly toggle: (id: NodeId) => void;
  readonly select: (id: NodeId, path: readonly NodeId[]) => void;
  readonly childrenOf: (id: NodeId) => readonly NodeId[];
  readonly titleOf: (id: NodeId) => string;
  readonly appearanceCount: (id: NodeId) => number;
};

export const normalizedCtxKey: InjectionKey<NormalizedTreeCtx> = Symbol("tree-normalized-ctx");
