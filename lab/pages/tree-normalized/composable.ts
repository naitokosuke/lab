import { computed, ref } from "vue";
import { mockFetchTree, type NodeId } from "../../shared/tree";
import { useTreeStore } from "./store";

export function useNormalizedTree() {
  const store = useTreeStore();
  const loading = ref(false);
  const seed = ref(1);
  const openedIds = ref<Set<NodeId>>(new Set());
  const selectedAppearance = ref<{ id: NodeId; path: readonly NodeId[] } | null>(null);
  const filter = ref("");
  const toast = ref<{ kind: "ok" | "err"; text: string } | null>(null);

  async function load() {
    loading.value = true;
    try {
      const tree = await mockFetchTree({
        seed: seed.value,
        rootCount: 1,
        maxDepth: 4,
        minChildren: 2,
        maxChildren: 4,
        targetCount: 50,
        dagLinkCount: 3,
        delayMs: 120,
      });
      store.loadFromRaw(tree);
      // 初期表示で depth<=1 を開く
      const initial = new Set<NodeId>();
      const stack: { id: NodeId; depth: number }[] = store.state.rootIds.map((id) => ({
        id,
        depth: 0,
      }));
      while (stack.length) {
        const cur = stack.pop()!;
        if (cur.depth <= 1 && (store.state.childrenIds[cur.id]?.length ?? 0) > 0) {
          initial.add(cur.id);
        }
        for (const c of store.state.childrenIds[cur.id] ?? []) {
          stack.push({ id: c, depth: cur.depth + 1 });
        }
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

  /**
   * appearance toggle: 同一 id でも appearance パス (祖先 id 列) が違えば
   * 独立に opened を管理したいが、ここでは id ベースで toggle する単純実装。
   * DAG ノードは全 appearance が同期して開閉する。
   */
  function toggle(id: NodeId) {
    const next = new Set(openedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openedIds.value = next;
  }

  function selectAppearance(id: NodeId, path: readonly NodeId[]) {
    if (selectedAppearance.value && selectedAppearance.value.id === id) {
      selectedAppearance.value = null;
    } else {
      selectedAppearance.value = { id, path };
    }
  }

  function expandAll() {
    const next = new Set<NodeId>();
    for (const k of Object.keys(store.state.childrenIds)) {
      if ((store.state.childrenIds[k]?.length ?? 0) > 0) next.add(k);
    }
    openedIds.value = next;
  }
  function collapseAll() {
    openedIds.value = new Set();
  }

  function moveNode(id: NodeId, newParentId: NodeId) {
    const r = store.moveNode(id, newParentId);
    toast.value = r.ok
      ? { kind: "ok", text: `moved ${id} → ${newParentId}` }
      : { kind: "err", text: `move rejected: ${r.reason ?? "unknown"}` };
  }
  function addParentLink(childId: NodeId, parentId: NodeId) {
    const r = store.addParentLink(childId, parentId);
    toast.value = r.ok
      ? { kind: "ok", text: `link added ${parentId} → ${childId} (now DAG)` }
      : { kind: "err", text: `link rejected: ${r.reason ?? "unknown"}` };
  }

  const breadcrumb = computed(() => {
    const sel = selectedAppearance.value;
    if (!sel) return [];
    return [...sel.path, sel.id].map((id) => ({
      id,
      title: store.state.nodes[id]?.title ?? id,
    }));
  });

  const matchedIds = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (q === "") return null;
    const out = new Set<NodeId>();
    for (const id of Object.keys(store.state.nodes)) {
      if (store.state.nodes[id]!.title.toLowerCase().includes(q)) out.add(id);
    }
    return out;
  });

  void load();

  return {
    store,
    loading,
    seed,
    openedIds,
    selectedAppearance,
    filter,
    matchedIds,
    breadcrumb,
    toast,
    refresh,
    toggle,
    selectAppearance,
    expandAll,
    collapseAll,
    moveNode,
    addParentLink,
  };
}
