import type { NodeId, RawNode } from "./types";

export type Visit = {
  readonly node: RawNode;
  readonly depth: number;
  readonly path: readonly NodeId[];
};

/**
 * 深さ優先で全ノードを巡回する反復子。スタックベースなので無限に深くても
 * call stack を消費しない (深さ 50,000 級でも安全)。
 */
export function* iterateDepthFirst(roots: readonly RawNode[]): Generator<Visit> {
  type Frame = { node: RawNode; depth: number; path: NodeId[] };
  const stack: Frame[] = [];
  for (let i = roots.length - 1; i >= 0; i--) {
    stack.push({ node: roots[i]!, depth: 0, path: [] });
  }
  while (stack.length > 0) {
    const frame = stack.pop()!;
    yield { node: frame.node, depth: frame.depth, path: frame.path };
    const children = frame.node.children;
    if (!children) continue;
    const nextPath = [...frame.path, frame.node.id];
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push({ node: children[i]!, depth: frame.depth + 1, path: nextPath });
    }
  }
}

export function countNodes(roots: readonly RawNode[]): number {
  let n = 0;
  for (const _ of iterateDepthFirst(roots)) n++;
  return n;
}

/** target に至る ID パス (target を含む) を返す。なければ null */
export function findPath(roots: readonly RawNode[], target: NodeId): readonly NodeId[] | null {
  for (const visit of iterateDepthFirst(roots)) {
    if (visit.node.id === target) return [...visit.path, visit.node.id];
  }
  return null;
}

/** title が query を含むノードのみを残した tree を返す。空サブツリーは落とす */
export function filterTree(roots: readonly RawNode[], query: string): readonly RawNode[] {
  const q = query.trim().toLowerCase();
  if (q === "") return roots;

  const walk = (node: RawNode): RawNode | null => {
    const selfMatch = node.title.toLowerCase().includes(q);
    if (!node.children || node.children.length === 0) {
      return selfMatch ? { id: node.id, title: node.title } : null;
    }
    const filteredChildren: RawNode[] = [];
    for (const c of node.children) {
      const kept = walk(c);
      if (kept) filteredChildren.push(kept);
    }
    if (filteredChildren.length === 0 && !selfMatch) return null;
    return filteredChildren.length > 0
      ? { id: node.id, title: node.title, children: filteredChildren }
      : { id: node.id, title: node.title };
  };

  const out: RawNode[] = [];
  for (const r of roots) {
    const kept = walk(r);
    if (kept) out.push(kept);
  }
  return out;
}
