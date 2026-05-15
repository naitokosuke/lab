import { computed, ref, shallowRef, triggerRef } from "vue";
import { mockFetchTree, type NodeId, type RawNode } from "../../shared/tree";

/**
 * 親 backref つきの BiNode。UI 状態 (isOpened / isSelected) は node 自体に置く。
 * 親があるので breadcrumb・reveal は O(depth) で歩ける。
 * 親 ↔ 子 が循環するので reactive() で deep-proxy せず shallowRef + triggerRef で扱う。
 */
export type BiNode = {
  readonly id: NodeId;
  readonly title: string;
  readonly parent: BiNode | null;
  readonly children: readonly BiNode[];
  readonly isOpened: boolean;
  readonly isSelected: boolean;
};

/** 内部 mutate 用。public surface は readonly のまま。 */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function buildBiTree(raw: readonly RawNode[]): BiNode[] {
  function build(rawNode: RawNode, parent: BiNode | null): BiNode {
    const node: Mutable<BiNode> = {
      id: rawNode.id,
      title: rawNode.title,
      parent,
      children: [],
      isOpened: false,
      isSelected: false,
    };
    node.children = (rawNode.children ?? []).map((c) => build(c, node));
    return node;
  }
  return raw.map((r) => build(r, null));
}

/**
 * id-based reconciliation: 既存ノードを mutate して reference identity を保つ。
 * 新規 id は新しいオブジェクトを作成。消えた id は dangling になるが GC に任せる。
 */
function reconcileBiTree(existingRoots: readonly BiNode[], freshRaw: readonly RawNode[]): BiNode[] {
  const byId = new Map<NodeId, BiNode>();
  const stack: BiNode[] = [...existingRoots];
  while (stack.length) {
    const n = stack.pop()!;
    byId.set(n.id, n);
    for (const c of n.children) stack.push(c);
  }
  function merge(rawNode: RawNode, parent: BiNode | null): BiNode {
    const existing = byId.get(rawNode.id);
    if (existing) {
      const m = existing as Mutable<BiNode>;
      m.parent = parent;
      m.title = rawNode.title;
      m.children = (rawNode.children ?? []).map((c) => merge(c, existing));
      return existing;
    }
    const node: Mutable<BiNode> = {
      id: rawNode.id,
      title: rawNode.title,
      parent,
      children: [],
      isOpened: false,
      isSelected: false,
    };
    node.children = (rawNode.children ?? []).map((c) => merge(c, node));
    return node;
  }
  return freshRaw.map((r) => merge(r, null));
}

/** 循環参照を避ける custom serializer。`parent` キーを drop する。 */
export function serializeWithoutParent(node: BiNode, indent = 2): string {
  return JSON.stringify(node, (key, value) => (key === "parent" ? undefined : value), indent);
}

function walkAll(roots: readonly BiNode[], visit: (n: BiNode) => void) {
  const stack: BiNode[] = [...roots];
  while (stack.length) {
    const n = stack.pop()!;
    visit(n);
    for (const c of n.children) stack.push(c);
  }
}

export function useBidirectionalTree() {
  const roots = shallowRef<readonly BiNode[]>([]);
  const loading = ref(false);
  const seed = ref(1);
  const selectedId = ref<NodeId | null>(null);
  const filter = ref("");
  const identityProbe = ref<{ id: string; sameRef: boolean | null }>({ id: "", sameRef: null });
  const totalNodes = ref(0);

  async function fetchRaw(): Promise<readonly RawNode[]> {
    const tree = await mockFetchTree({
      seed: seed.value,
      rootCount: 1,
      maxDepth: 5,
      minChildren: 2,
      maxChildren: 4,
      targetCount: 80,
      delayMs: 120,
    });
    return tree.roots;
  }

  function recount() {
    let n = 0;
    walkAll(roots.value, () => n++);
    totalNodes.value = n;
  }

  async function load() {
    loading.value = true;
    try {
      const raw = await fetchRaw();
      roots.value = buildBiTree(raw);
      walkAll(roots.value, (n) => {
        if (n.children.length > 0 && (n.parent == null || n.parent.parent == null)) {
          (n as Mutable<BiNode>).isOpened = true;
        }
      });
      recount();
      triggerRef(roots);
    } finally {
      loading.value = false;
    }
  }

  /** 既存 BiNode を in-place で更新するリフレッシュ。reference identity が生き残る。 */
  async function refresh() {
    loading.value = true;
    try {
      const probeRoot = roots.value[0] ?? null;
      const raw = await fetchRaw();
      roots.value = reconcileBiTree(roots.value, raw);
      recount();
      triggerRef(roots);
      if (probeRoot) {
        const after = findById(probeRoot.id);
        identityProbe.value = { id: probeRoot.id, sameRef: after === probeRoot };
      }
    } finally {
      loading.value = false;
    }
  }

  function findById(id: NodeId): BiNode | null {
    let found: BiNode | null = null;
    walkAll(roots.value, (n) => {
      if (n.id === id) found = n;
    });
    return found;
  }

  function toggle(id: NodeId) {
    const n = findById(id);
    if (!n) return;
    (n as Mutable<BiNode>).isOpened = !n.isOpened;
    triggerRef(roots);
  }

  function select(id: NodeId) {
    const prev = selectedId.value != null ? findById(selectedId.value) : null;
    if (prev) (prev as Mutable<BiNode>).isSelected = false;
    const isSame = selectedId.value === id;
    selectedId.value = isSame ? null : id;
    if (!isSame) {
      const next = findById(id);
      if (next) {
        (next as Mutable<BiNode>).isSelected = true;
        // reveal: node.parent を上に歩いて全祖先を開く。O(depth) — 親 backref の威力。
        let p = next.parent;
        while (p) {
          (p as Mutable<BiNode>).isOpened = true;
          p = p.parent;
        }
      }
    }
    triggerRef(roots);
  }

  function expandAll() {
    walkAll(roots.value, (n) => {
      if (n.children.length > 0) (n as Mutable<BiNode>).isOpened = true;
    });
    triggerRef(roots);
  }

  function collapseAll() {
    walkAll(roots.value, (n) => {
      (n as Mutable<BiNode>).isOpened = false;
    });
    triggerRef(roots);
  }

  /** filter: title マッチした子孫を含むサブツリーだけ残す。BiNode はそのまま (identity 保つ) */
  const filteredRoots = computed<readonly BiNode[]>(() => {
    const q = filter.value.trim().toLowerCase();
    if (q === "") return roots.value;
    const keep = new Set<NodeId>();
    function visit(n: BiNode): boolean {
      let kept = n.title.toLowerCase().includes(q);
      for (const c of n.children) if (visit(c)) kept = true;
      if (kept) keep.add(n.id);
      return kept;
    }
    for (const r of roots.value) visit(r);
    return roots.value.filter((r) => keep.has(r.id));
  });

  function filteredChildren(n: BiNode): readonly BiNode[] {
    const q = filter.value.trim().toLowerCase();
    if (q === "") return n.children;
    function matches(node: BiNode): boolean {
      if (node.title.toLowerCase().includes(q)) return true;
      for (const c of node.children) if (matches(c)) return true;
      return false;
    }
    return n.children.filter(matches);
  }

  /** 選択ノードの breadcrumb。node.parent を上に歩く。O(depth) */
  const breadcrumb = computed<readonly { id: string; title: string }[]>(() => {
    const id = selectedId.value;
    if (id == null) return [];
    const node = findById(id);
    if (!node) return [];
    const out: { id: string; title: string }[] = [];
    let cur: BiNode | null = node;
    while (cur) {
      out.unshift({ id: cur.id, title: cur.title });
      cur = cur.parent;
    }
    return out;
  });

  void load();

  return {
    roots,
    filteredRoots,
    filteredChildren,
    loading,
    seed,
    selectedId,
    filter,
    breadcrumb,
    totalNodes,
    identityProbe,
    refresh,
    toggle,
    select,
    expandAll,
    collapseAll,
  };
}
