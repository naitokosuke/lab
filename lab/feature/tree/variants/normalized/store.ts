import { computed, reactive } from "vue";
import { iterateDepthFirst, type NodeId, type RawTree } from "../../shared/tree";

/**
 * Pinia は依存に含めていないので、module-level reactive() シングルトン +
 * useTreeStore() で同等の state / actions / getters を提供する。
 */

type NodeEntity = { readonly id: NodeId; title: string };

export type StoreState = {
  nodes: Record<NodeId, NodeEntity>;
  childrenIds: Record<NodeId, NodeId[]>;
  parentIds: Record<NodeId, NodeId[]>;
  rootIds: NodeId[];
};

const state = reactive<StoreState>({
  nodes: {},
  childrenIds: {},
  parentIds: {},
  rootIds: [],
});

function loadFromRaw(tree: RawTree) {
  state.nodes = {};
  state.childrenIds = {};
  state.parentIds = {};
  state.rootIds = tree.roots.map((r) => r.id);

  for (const visit of iterateDepthFirst(tree.roots)) {
    state.nodes[visit.node.id] = { id: visit.node.id, title: visit.node.title };
    state.childrenIds[visit.node.id] = (visit.node.children ?? []).map((c) => c.id);
    if (!state.parentIds[visit.node.id]) state.parentIds[visit.node.id] = [];
    for (const c of visit.node.children ?? []) {
      const arr = state.parentIds[c.id] ?? [];
      if (!arr.includes(visit.node.id)) arr.push(visit.node.id);
      state.parentIds[c.id] = arr;
    }
  }
  // dagLinks を適用 — 同じ子を別の親にも紐づけて DAG にする
  for (const link of tree.dagLinks ?? []) {
    if (!state.nodes[link.parentId] || !state.nodes[link.childId]) continue;
    const kids = state.childrenIds[link.parentId] ?? [];
    if (!kids.includes(link.childId)) kids.push(link.childId);
    state.childrenIds[link.parentId] = kids;
    const parents = state.parentIds[link.childId] ?? [];
    if (!parents.includes(link.parentId)) parents.push(link.parentId);
    state.parentIds[link.childId] = parents;
  }
}

/** id の全子孫 id を集める (move/addParent の cycle 防止用) */
function collectDescendants(id: NodeId): Set<NodeId> {
  const out = new Set<NodeId>();
  const stack = [...(state.childrenIds[id] ?? [])];
  while (stack.length) {
    const x = stack.pop()!;
    if (out.has(x)) continue;
    out.add(x);
    for (const c of state.childrenIds[x] ?? []) stack.push(c);
  }
  return out;
}

function rename(id: NodeId, title: string) {
  const n = state.nodes[id];
  if (n) n.title = title;
}

function moveNode(id: NodeId, newParentId: NodeId): { ok: boolean; reason?: string } {
  if (id === newParentId) return { ok: false, reason: "cannot parent to itself" };
  const desc = collectDescendants(id);
  if (desc.has(newParentId)) return { ok: false, reason: "would create a cycle" };

  // 既存の親から外す
  const oldParents = state.parentIds[id] ?? [];
  for (const p of oldParents) {
    state.childrenIds[p] = (state.childrenIds[p] ?? []).filter((c) => c !== id);
  }
  state.rootIds = state.rootIds.filter((r) => r !== id);
  // 新しい親へ
  const kids = state.childrenIds[newParentId] ?? [];
  if (!kids.includes(id)) kids.push(id);
  state.childrenIds[newParentId] = kids;
  state.parentIds[id] = [newParentId];
  return { ok: true };
}

function addParentLink(childId: NodeId, parentId: NodeId): { ok: boolean; reason?: string } {
  if (childId === parentId) return { ok: false, reason: "cannot link to itself" };
  if (collectDescendants(childId).has(parentId))
    return { ok: false, reason: "would create a cycle" };
  const kids = state.childrenIds[parentId] ?? [];
  if (kids.includes(childId)) return { ok: false, reason: "link already exists" };
  kids.push(childId);
  state.childrenIds[parentId] = kids;
  const parents = state.parentIds[childId] ?? [];
  parents.push(parentId);
  state.parentIds[childId] = parents;
  return { ok: true };
}

export function useTreeStore() {
  const totalEntities = computed(() => Object.keys(state.nodes).length);
  const totalAppearances = computed(() => {
    let n = state.rootIds.length;
    for (const k of Object.keys(state.childrenIds)) {
      n += state.childrenIds[k]?.length ?? 0;
    }
    return n;
  });
  const dagNodeCount = computed(() => {
    let n = 0;
    for (const k of Object.keys(state.parentIds)) {
      if ((state.parentIds[k]?.length ?? 0) > 1) n++;
    }
    return n;
  });
  return {
    state,
    loadFromRaw,
    rename,
    moveNode,
    addParentLink,
    appearanceCount: (id: NodeId) => Math.max(1, state.parentIds[id]?.length ?? 1),
    totalEntities,
    totalAppearances,
    dagNodeCount,
  };
}
