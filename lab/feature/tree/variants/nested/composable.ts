import { computed, ref, shallowRef } from "vue";
import {
  filterTree,
  findPath,
  iterateDepthFirst,
  mockFetchTree,
  type NodeId,
  type RawNode,
} from "../../shared/tree";

/**
 * children-only な RawNode 木をそのまま保持。UI 状態 (opened / selected) は
 * 木の外に Set<NodeId> として置く。リフレッシュで木全体が新しい identity に
 * 差し替わっても、id が一致する限り UI 状態は生き残る。
 */
export function useNestedTree() {
  const roots = shallowRef<readonly RawNode[]>([]);
  const loading = ref(false);
  const seed = ref(1);

  const openedIds = ref<Set<NodeId>>(new Set());
  const selectedId = ref<NodeId | null>(null);
  const filter = ref("");

  async function load() {
    loading.value = true;
    try {
      const tree = await mockFetchTree({
        seed: seed.value,
        rootCount: 1,
        maxDepth: 5,
        minChildren: 2,
        maxChildren: 4,
        targetCount: 80,
        delayMs: 120,
      });
      roots.value = tree.roots;
      // 初期表示で何も見えないのを避けるため depth<=1 を開いた状態にする。
      const initial = new Set<NodeId>();
      for (const v of iterateDepthFirst(tree.roots)) {
        if (v.depth <= 1 && v.node.children?.length) initial.add(v.node.id);
      }
      openedIds.value = initial;
    } finally {
      loading.value = false;
    }
  }

  function refresh() {
    seed.value += 1;
    return load();
  }

  function toggle(id: NodeId) {
    const next = new Set(openedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openedIds.value = next;
  }

  function select(id: NodeId) {
    selectedId.value = selectedId.value === id ? null : id;
  }

  function expandAll() {
    const next = new Set<NodeId>();
    for (const v of iterateDepthFirst(roots.value)) {
      if (v.node.children?.length) next.add(v.node.id);
    }
    openedIds.value = next;
  }

  function collapseAll() {
    openedIds.value = new Set();
  }

  const filteredRoots = computed(() => filterTree(roots.value, filter.value));

  const totalNodes = computed(() => {
    let n = 0;
    for (const _ of iterateDepthFirst(roots.value)) n++;
    return n;
  });

  /** 選択ノードへのパス。RawNode は親参照を持たないので root から DFS。O(N) */
  const breadcrumb = computed(() => {
    const id = selectedId.value;
    if (id == null) return [];
    const idPath = findPath(roots.value, id);
    if (!idPath) return [];
    const titleById = new Map<NodeId, string>();
    for (const v of iterateDepthFirst(roots.value)) titleById.set(v.node.id, v.node.title);
    return idPath.map((nid) => ({ id: nid, title: titleById.get(nid) ?? nid }));
  });

  void load();

  return {
    roots,
    filteredRoots,
    loading,
    seed,
    openedIds,
    selectedId,
    filter,
    breadcrumb,
    totalNodes,
    refresh,
    toggle,
    select,
    expandAll,
    collapseAll,
  };
}
