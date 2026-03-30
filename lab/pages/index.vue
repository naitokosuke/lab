<script setup lang="ts">
import { NKLCard } from "@lab/design/components";
import { RouterLink } from "vue-router";
import { labPages } from "./meta";
</script>

<template>
  <main id="home">
    <h1>ナイトウコウスケ's Lab</h1>
    <nav aria-label="Lab experiments">
      <RouterLink v-for="(meta, name) in labPages" :key="name" :to="{ name }">
        <NKLCard>
          <h2>{{ meta.title }}</h2>
          <p>{{ meta.description }}</p>
          <ul aria-label="Tags">
            <li v-for="tag in meta.tags" :key="tag">{{ tag }}</li>
          </ul>
        </NKLCard>
      </RouterLink>
    </nav>
  </main>
</template>

<style scoped>
#home {
  padding: var(--space-6) var(--space-5);

  h1 {
    margin: 0 0 var(--space-5);
  }

  nav {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);

    a {
      text-decoration: none;
      color: inherit;

      :deep(.nkl-card) {
        height: 100%;
      }
    }
  }

  article {
    h2 {
      margin: 0 0 var(--space-2);
      font-size: var(--text-xl);
    }

    p {
      color: var(--text);
      font-size: var(--text-m);
    }

    ul {
      display: grid;
      grid-auto-flow: column;
      justify-content: start;
      gap: var(--space-2);
      margin-top: var(--space-3);
      padding: 0;
      list-style: none;

      li {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-s);
        background: var(--accent-bg);
        color: var(--accent);
      }
    }
  }
}
</style>
