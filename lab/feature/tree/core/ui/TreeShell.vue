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
      <p v-if="description !== undefined" class="lede">{{ description }}</p>
    </header>

    <section aria-label="Controls" class="controls">
      <slot name="controls" />
    </section>

    <section v-if="$slots.stats !== undefined" aria-label="Stats" class="stats">
      <slot name="stats" />
    </section>

    <section aria-label="Selected node path" class="breadcrumb">
      <slot name="breadcrumb">
        <span class="empty">Click a node title to see its path.</span>
      </slot>
    </section>

    <section aria-label="Tree" class="tree">
      <slot name="tree" />
    </section>

    <section v-if="$slots.detail !== undefined" aria-label="Details" class="detail">
      <slot name="detail" />
    </section>
  </main>
</template>

<style scoped>
.tree-shell {
  --tree-shell-max-inline-size: 920px;
  --tree-title-letter-spacing: -0.01em;
  --tree-lede-line-height: 1.55;
  --tree-lede-max-inline-size: 70ch;
  --tree-stats-bg-mix: 35%;
  --tree-breadcrumb-min-block-size: 2.25em;
  --tree-empty-opacity: 0.7;
  --tree-panel-min-block-size: 200px;
  --tree-panel-max-block-size: 60vh;
  --tree-emphasis-font-weight: 600;

  padding: var(--space-6) var(--space-5) var(--space-7);
  max-inline-size: var(--tree-shell-max-inline-size);
  margin: 0 auto;
  display: grid;
  gap: var(--space-4);

  header {
    h2 {
      margin: 0 0 var(--space-2);
      font-size: var(--text-2xl);
      letter-spacing: var(--tree-title-letter-spacing);
      text-wrap: balance;
    }
    .lede {
      margin: 0;
      color: var(--text);
      font-size: var(--text-m);
      line-height: var(--tree-lede-line-height);
      max-inline-size: var(--tree-lede-max-inline-size);
      text-wrap: pretty;
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
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-m);
  background: color-mix(in oklab, var(--accent-bg) var(--tree-stats-bg-mix), transparent);
  font-size: var(--text-s);
  font-family: var(--mono);
}

.breadcrumb {
  min-block-size: var(--tree-breadcrumb-min-block-size);
  padding: var(--space-2) var(--space-3);
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-m);
  font-size: var(--text-s);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--mono);

  .empty {
    color: var(--text);
    opacity: var(--tree-empty-opacity);
    font-style: italic;
    font-family: var(--sans);
  }
}

.tree {
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-m);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  min-block-size: var(--tree-panel-min-block-size);
  max-block-size: var(--tree-panel-max-block-size);
  overflow: hidden;
}

/* Each page wraps its scrolling content in :deep(.tree-scroll) inside the slot. */
.tree :deep(.tree-scroll) {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow: auto;
  padding: var(--space-2);
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.detail {
  display: grid;
  gap: var(--space-3);
}
</style>
