import { computed, ref, shallowRef } from "vue";
import { generateTree, type NodeId, type RawNode } from "../../core";

export type FlatNode = {
  readonly id: NodeId;
  readonly title: string;
  readonly depth: number;
  readonly hasChildren: boolean;
};

/** RawNode 木を depth 付きの 1 次元配列に flatten。スタックベース (深さ無制限) */
function flatten(roots: readonly RawNode[], openedIds: ReadonlySet<NodeId>): FlatNode[] {
  const out: FlatNode[] = [];
  type Frame = { node: RawNode; depth: number };
  const stack: Frame[] = [];
  for (let i = roots.length - 1; i >= 0; i--) stack.push({ node: roots[i]!, depth: 0 });
  while (stack.length) {
    const f = stack.pop()!;
    const kids = f.node.children;
    out.push({
      id: f.node.id,
      title: f.node.title,
      depth: f.depth,
      hasChildren: (kids?.length ?? 0) > 0,
    });
    if (kids && kids.length > 0 && openedIds.has(f.node.id)) {
      for (let i = kids.length - 1; i >= 0; i--) {
        stack.push({ node: kids[i]!, depth: f.depth + 1 });
      }
    }
  }
  return out;
}

/** flat 配列の index から「最初に depth が小さい」行を後方走査して親 index を見つける。O(visible chunk) */
export function findParentIndex(flat: readonly FlatNode[], index: number): number {
  const target = flat[index];
  if (!target) return -1;
  for (let i = index - 1; i >= 0; i--) {
    const f = flat[i]!;
    if (f.depth === target.depth - 1) return i;
    if (f.depth < target.depth - 1) return -1;
  }
  return -1;
}

export function useFlatTree(initialTargetCount = 10_000) {
  const targetCount = ref(initialTargetCount);
  const seed = ref(7);
  const sourceRoots = shallowRef<readonly RawNode[]>([]);
  const openedIds = ref<Set<NodeId>>(new Set());
  const flat = shallowRef<FlatNode[]>([]);
  const totalSource = ref(0);
  const lastToggleMs = ref<number | null>(null);
  const lastBulkMs = ref<number | null>(null);
  const fps = ref(0);

  function build() {
    const tree = generateTree({
      seed: seed.value,
      rootCount: 5,
      maxDepth: 12,
      minChildren: 2,
      maxChildren: 6,
      targetCount: targetCount.value,
    });
    sourceRoots.value = tree.roots;
    // 初期表示: depth <= 2 を open。10k+ ノードでも数百行は見えて、virtual
    // scroller が機能していることが体感できる。
    const initial = new Set<NodeId>();
    let count = 0;
    const stack: { node: RawNode; depth: number }[] = [];
    for (const r of tree.roots) stack.push({ node: r, depth: 0 });
    while (stack.length) {
      const f = stack.pop()!;
      count++;
      if (f.depth <= 2 && (f.node.children?.length ?? 0) > 0) initial.add(f.node.id);
      for (const c of f.node.children ?? []) stack.push({ node: c, depth: f.depth + 1 });
    }
    openedIds.value = initial;
    totalSource.value = count;
    flat.value = flatten(tree.roots, initial);
  }

  function toggle(id: NodeId) {
    const t0 = performance.now();
    const next = new Set(openedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openedIds.value = next;
    // 差分 splice ではなく簡潔さのため全体 flatten。targetCount 50k でも数十 ms。
    flat.value = flatten(sourceRoots.value, next);
    lastToggleMs.value = performance.now() - t0;
  }

  function expandAll() {
    const t0 = performance.now();
    const next = new Set<NodeId>();
    type F = { n: RawNode };
    const stack: F[] = sourceRoots.value.map((n) => ({ n }));
    while (stack.length) {
      const cur = stack.pop()!;
      if ((cur.n.children?.length ?? 0) > 0) next.add(cur.n.id);
      for (const c of cur.n.children ?? []) stack.push({ n: c });
    }
    openedIds.value = next;
    flat.value = flatten(sourceRoots.value, next);
    lastBulkMs.value = performance.now() - t0;
  }
  function collapseAll() {
    const t0 = performance.now();
    openedIds.value = new Set();
    flat.value = flatten(sourceRoots.value, openedIds.value);
    lastBulkMs.value = performance.now() - t0;
  }

  function setSize(n: number) {
    targetCount.value = n;
    seed.value += 1;
    build();
  }

  function refresh() {
    seed.value += 1;
    build();
  }

  // FPS sampler
  let last = performance.now();
  let frames = 0;
  let accum = 0;
  function tick(now: number) {
    frames++;
    accum += now - last;
    last = now;
    if (accum >= 250) {
      fps.value = Math.round((frames * 1000) / accum);
      frames = 0;
      accum = 0;
    }
    requestAnimationFrame(tick);
  }
  if (typeof window !== "undefined") requestAnimationFrame(tick);

  build();

  const visibleCount = computed(() => flat.value.length);

  return {
    flat,
    targetCount,
    seed,
    visibleCount,
    totalSource,
    openedIds,
    lastToggleMs,
    lastBulkMs,
    fps,
    toggle,
    expandAll,
    collapseAll,
    setSize,
    refresh,
  };
}
