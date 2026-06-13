import type { DagLink, NodeId, RawNode, RawTree } from "./types";

export type GenerateOptions = {
  /** 決定論的に生成するためのシード。同じシードからは常に同じツリーが出る */
  seed?: number;
  /** ルートノードの数 */
  rootCount?: number;
  /** 最大深さ (ルートが depth 0) */
  maxDepth?: number;
  /** 各ノードの子ノード数の下限 */
  minChildren?: number;
  /** 各ノードの子ノード数の上限 */
  maxChildren?: number;
  /** 目標ノード数。指定するとこの数前後で打ち切る */
  targetCount?: number;
  /**
   * DAG 化のための追加クロスリンク数。指定すると、ツリー内のノードを
   * 他のサブツリーの子としても繋ぐエッジを生成する (#6 normalized 用)。
   * ツリー前提のパターンはこのフィールドを参照しなければ影響を受けない。
   */
  dagLinkCount?: number;
  /** タイトル生成用の固定プレフィックス */
  titlePrefix?: string;
};

const TITLE_WORDS = [
  "Atlas",
  "Beacon",
  "Cinder",
  "Drift",
  "Ember",
  "Forge",
  "Glade",
  "Harbor",
  "Iris",
  "Junction",
  "Kestrel",
  "Lumen",
  "Marrow",
  "Nimbus",
  "Onyx",
  "Pivot",
  "Quartz",
  "Ridge",
  "Sable",
  "Trove",
  "Umbra",
  "Vellum",
  "Warden",
  "Yarrow",
  "Zephyr",
];

/** mulberry32 PRNG — 1 引数で決定論的、軽量、十分な品質 */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rng: () => number, min: number, max: number): number {
  if (max < min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

function pickWord(rng: () => number): string {
  return TITLE_WORDS[Math.floor(rng() * TITLE_WORDS.length)] ?? "Node";
}

export function generateTree(opts: GenerateOptions = {}): RawTree {
  const {
    seed = 42,
    rootCount = 3,
    maxDepth = 5,
    minChildren = 1,
    maxChildren = 4,
    targetCount,
    dagLinkCount = 0,
    titlePrefix,
  } = opts;

  const rng = makeRng(seed);
  let counter = 0;
  let totalCount = 0;
  const allIds: NodeId[] = [];
  const depthById = new Map<NodeId, number>();
  // 同じサブツリーの中で循環/ループを作らないよう、各ノードの祖先 id を覚えておく
  const ancestorsById = new Map<NodeId, ReadonlySet<NodeId>>();

  const overBudget = () => targetCount !== undefined && totalCount >= targetCount;

  type Mut = { id: NodeId; title: string; children?: RawNode[] };

  function makeNode(depth: number, ancestors: ReadonlySet<NodeId>): Mut {
    const id = `n${counter++}`;
    const title = titlePrefix ? `${titlePrefix} ${id}` : `${pickWord(rng)} ${id}`;
    totalCount++;
    allIds.push(id);
    depthById.set(id, depth);
    ancestorsById.set(id, ancestors);
    return { id, title };
  }

  // BFS 構築: 木を level ごとに広げる。DFS だと最初の枝の子孫が targetCount を
  // 食い切って残りの枝が空になるので、large targetCount で一本鎖になる問題を防ぐ。
  const roots: Mut[] = [];
  const queue: { node: Mut; depth: number; ancestors: ReadonlySet<NodeId> }[] = [];
  for (let i = 0; i < rootCount; i++) {
    if (overBudget()) break;
    const r = makeNode(0, new Set());
    roots.push(r);
    queue.push({ node: r, depth: 0, ancestors: new Set() });
  }

  while (queue.length > 0 && !overBudget()) {
    const { node: parent, depth, ancestors } = queue.shift()!;
    if (depth >= maxDepth) continue;
    const childCount = pickInt(rng, minChildren, maxChildren);
    if (childCount === 0) continue;
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(parent.id);
    const kids: Mut[] = [];
    for (let i = 0; i < childCount; i++) {
      if (overBudget()) break;
      const child = makeNode(depth + 1, nextAncestors);
      kids.push(child);
      queue.push({ node: child, depth: depth + 1, ancestors: nextAncestors });
    }
    if (kids.length > 0) parent.children = kids;
  }

  let dagLinks: DagLink[] | undefined;
  if (dagLinkCount > 0 && allIds.length > 1) {
    dagLinks = [];
    const existingEdges = new Set<string>();
    let attempts = 0;
    while (dagLinks.length < dagLinkCount && attempts < dagLinkCount * 20) {
      attempts++;
      const parentId = allIds[Math.floor(rng() * allIds.length)]!;
      const childId = allIds[Math.floor(rng() * allIds.length)]!;
      if (parentId === childId) continue;
      // 親候補が子候補の祖先になっていると本物のサイクルになるのでスキップ。
      // 同様に子候補が親候補の祖先でも (= 逆向きでも) サイクル。
      const parentAncestors = ancestorsById.get(parentId);
      if (parentAncestors?.has(childId)) continue;
      // 親が深すぎ・子が浅すぎる組み合わせはトポロジ的に逆流するので避ける
      const pd = depthById.get(parentId) ?? 0;
      const cd = depthById.get(childId) ?? 0;
      if (pd >= cd) continue;
      const key = `${parentId}>${childId}`;
      if (existingEdges.has(key)) continue;
      existingEdges.add(key);
      dagLinks.push({ parentId, childId });
    }
  }

  return dagLinks && dagLinks.length > 0 ? { roots, dagLinks } : { roots };
}
