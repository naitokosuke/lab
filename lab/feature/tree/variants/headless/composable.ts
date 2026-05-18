import { ref, shallowRef } from "vue";
import { mockFetchTree, type RawNode } from "../../shared/tree";

export function useHeadlessTree() {
  const roots = shallowRef<readonly RawNode[]>([]);
  const loading = ref(false);
  const seed = ref(1);

  async function load() {
    loading.value = true;
    try {
      const tree = await mockFetchTree({
        seed: seed.value,
        rootCount: 1,
        maxDepth: 5,
        minChildren: 2,
        maxChildren: 4,
        targetCount: 60,
        delayMs: 120,
      });
      roots.value = tree.roots;
    } finally {
      loading.value = false;
    }
  }

  function refresh() {
    seed.value += 1;
    return load();
  }

  void load();

  return { roots, loading, seed, refresh };
}
