export type NodeId = string;

/**
 * 純粋なツリーの最小表現。親参照を持たないため、複数の組み立て方
 * (recursive component / bidirectional / normalized / flattened / headless)
 * の共通入力として使える。
 */
export type RawNode = {
  readonly id: NodeId;
  readonly title: string;
  readonly children?: readonly RawNode[];
};

/**
 * 生成元データ。`dagLinks` は #6 (normalized) で同一ノードを複数の親に
 * ぶら下げて DAG を作るための追加エッジ。tree 構造としては `roots` のみ
 * が支配的で、ツリーパターンは `dagLinks` を無視できる。
 */
export type RawTree = {
  readonly roots: readonly RawNode[];
  readonly dagLinks?: readonly DagLink[];
};

export type DagLink = {
  readonly parentId: NodeId;
  readonly childId: NodeId;
};
