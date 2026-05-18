<script setup lang="ts">
/**
 * 5 ページ共通のレイアウトシェル。
 * slots:
 *   - controls: コントロールバー (refresh / expand all / filter など)
 *   - stats: 統計チップ (nodes / opened / selected ...)
 *   - breadcrumb: 選択ノードのパス
 *   - tree: ツリー本体 (各ページがデータ構造ごとに構築)
 *   - detail: ページ固有の追加デモ (任意)
 */
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <main class="tree-shell">
    <header>
      <h2>{{ title }}</h2>
      <p v-if="description" class="lede">{{ description }}</p>
    </header>

    <section class="controls" aria-label="Controls">
      <slot name="controls" />
    </section>

    <section v-if="$slots.stats" class="stats" aria-label="Stats">
      <slot name="stats" />
    </section>

    <section class="breadcrumb" aria-label="Selected node path">
      <slot name="breadcrumb">
        <span class="empty">Click a node title to see its path.</span>
      </slot>
    </section>

    <section class="tree" aria-label="Tree">
      <slot name="tree" />
    </section>

    <section v-if="$slots.detail" class="detail" aria-label="Details">
      <slot name="detail" />
    </section>
  </main>
</template>

<style scoped>
.tree-shell {
  padding: var(--space-6) var(--space-5) var(--space-7);
  max-inline-size: 920px;
  margin: 0 auto;
  display: grid;
  gap: var(--space-4);

  header {
    h2 {
      margin: 0 0 var(--space-2);
      font-size: var(--text-2xl);
      letter-spacing: -0.01em;
    }
    .lede {
      margin: 0;
      color: var(--text);
      font-size: var(--text-m);
      line-height: 1.55;
      max-inline-size: 70ch;
    }
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  background: color-mix(in oklab, var(--accent-bg) 35%, transparent);
  font-size: var(--text-s);
  font-family: var(--mono);
}

.breadcrumb {
  min-block-size: 2.25em;
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--border);
  border-radius: var(--radius-m);
  font-size: var(--text-s);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--mono);

  .empty {
    color: var(--text);
    opacity: 0.7;
    font-style: italic;
    font-family: var(--sans);
  }
}

.tree {
  margin: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  min-block-size: 200px;
  max-block-size: 60vh;
  overflow: hidden;
}

/* Each page wraps its scrolling content in :deep(.tree-scroll) inside the slot. */
.tree :deep(.tree-scroll) {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow: auto;
  padding: var(--space-2);
  scroll-behavior: smooth;
}

.detail {
  display: grid;
  gap: var(--space-3);
}
</style>
