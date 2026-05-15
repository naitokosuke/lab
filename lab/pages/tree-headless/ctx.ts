import { computed, inject, type ComputedRef, type InjectionKey, provide, ref, type Ref } from "vue";
import type { NodeId } from "../../shared/tree";

/**
 * hand-rolled headless compound components の provide/inject 接点。
 * Treeview.Root が state を provide し、Group / Activator / Content / Item が
 * inject して open / select を読み書きする。Hierarchy は DOM のネスティングが
 * 表現する (data prop ではない)。
 */

export type OpenMode = "multiple" | "single" | "all";
export type SelectionMode = "cascade" | "independent" | "leaf";

export type RootCtx = {
  readonly openedIds: Ref<Set<NodeId>>;
  readonly selectedIds: Ref<Set<NodeId>>;
  readonly focusedId: Ref<NodeId | null>;
  readonly openMode: Ref<OpenMode>;
  readonly selectionMode: Ref<SelectionMode>;
  readonly registerItem: (id: NodeId, info: ItemInfo) => () => void;
  readonly isOpen: (id: NodeId) => boolean;
  readonly isSelected: (id: NodeId) => boolean;
  readonly toggle: (id: NodeId) => void;
  readonly select: (id: NodeId) => void;
  readonly focus: (id: NodeId | null) => void;
  readonly visibleOrderedIds: ComputedRef<readonly NodeId[]>;
  readonly itemInfo: (id: NodeId) => ItemInfo | undefined;
  readonly setParent: (id: NodeId, parentId: NodeId | null) => void;
};

export type ItemInfo = {
  readonly id: NodeId;
  readonly hasChildren: boolean;
  readonly depth: number;
  parentId: NodeId | null;
};

export const rootCtxKey: InjectionKey<RootCtx> = Symbol("headless-tree-root");

/** Group が自分の id を子孫に伝えるための inject */
export type GroupCtx = { readonly groupId: NodeId };
export const groupCtxKey: InjectionKey<GroupCtx> = Symbol("headless-tree-group");

export function useRootCtx() {
  const ctx = inject(rootCtxKey);
  if (!ctx) throw new Error("Must be used inside <Treeview.Root>");
  return ctx;
}

export function provideRoot(args: { openMode: Ref<OpenMode>; selectionMode: Ref<SelectionMode> }) {
  const openedIds = ref<Set<NodeId>>(new Set());
  const selectedIds = ref<Set<NodeId>>(new Set());
  const focusedId = ref<NodeId | null>(null);
  const items = new Map<NodeId, ItemInfo>();
  const itemsTrigger = ref(0);

  const registerItem: RootCtx["registerItem"] = (id, info) => {
    items.set(id, { ...info });
    itemsTrigger.value++;
    return () => {
      items.delete(id);
      itemsTrigger.value++;
    };
  };

  const setParent: RootCtx["setParent"] = (id, parentId) => {
    const cur = items.get(id);
    if (cur) cur.parentId = parentId;
  };

  function isOpen(id: NodeId): boolean {
    if (args.openMode.value === "all") return true;
    return openedIds.value.has(id);
  }

  function isSelected(id: NodeId): boolean {
    return selectedIds.value.has(id);
  }

  function toggle(id: NodeId) {
    const cur = new Set(openedIds.value);
    if (args.openMode.value === "single") {
      // accordion: 同階層で開いていたものを閉じる
      const me = items.get(id);
      if (cur.has(id)) cur.delete(id);
      else {
        for (const k of Array.from(cur)) {
          const info = items.get(k);
          if (info && me && info.parentId === me.parentId) cur.delete(k);
        }
        cur.add(id);
      }
    } else if (args.openMode.value === "all") {
      // ignored
      return;
    } else {
      if (cur.has(id)) cur.delete(id);
      else cur.add(id);
    }
    openedIds.value = cur;
  }

  function select(id: NodeId) {
    const cur = new Set(selectedIds.value);
    const info = items.get(id);
    if (args.selectionMode.value === "leaf" && info?.hasChildren) {
      // leaf only — toggle on activator does nothing for branches
      return;
    }
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    if (args.selectionMode.value === "cascade" && info) {
      // 子孫もまとめて切替
      const target = cur.has(id);
      const stack: NodeId[] = [];
      for (const [k, v] of items) if (v.parentId === id) stack.push(k);
      while (stack.length) {
        const x = stack.pop()!;
        if (target) cur.add(x);
        else cur.delete(x);
        for (const [k, v] of items) if (v.parentId === x) stack.push(k);
      }
    }
    selectedIds.value = cur;
  }

  function focus(id: NodeId | null) {
    focusedId.value = id;
  }

  const visibleOrderedIds = computed<readonly NodeId[]>(() => {
    void itemsTrigger.value;
    // open に基づく可視リスト。簡略のため: items は depth 順ではないので
    // parentId -> children の対応を再構築し、root から DFS で並べる。
    const childrenOf = new Map<NodeId | null, NodeId[]>();
    for (const [id, info] of items) {
      const arr = childrenOf.get(info.parentId) ?? [];
      arr.push(id);
      childrenOf.set(info.parentId, arr);
    }
    const out: NodeId[] = [];
    const stack: NodeId[] = [...(childrenOf.get(null) ?? [])].reverse();
    while (stack.length) {
      const id = stack.pop()!;
      out.push(id);
      if (isOpen(id)) {
        const kids = childrenOf.get(id);
        if (kids) for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]!);
      }
    }
    return out;
  });

  const ctx: RootCtx = {
    openedIds,
    selectedIds,
    focusedId,
    openMode: args.openMode,
    selectionMode: args.selectionMode,
    registerItem,
    isOpen,
    isSelected,
    toggle,
    select,
    focus,
    visibleOrderedIds,
    itemInfo: (id) => items.get(id),
    setParent,
  };
  provide(rootCtxKey, ctx);
  return ctx;
}
