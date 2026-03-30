<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { computed } from "vue";

const router = useRouter();
const labPages = computed(() => router.getRoutes().filter((r) => r.name !== "/" && r.meta?.title));
</script>

<template>
  <main id="home">
    <h1>ナイトウコウスケ's Lab</h1>
    <nav aria-label="Lab experiments">
      <RouterLink v-for="route in labPages" :key="route.name" :to="route.path">
        <article>
          <h2>{{ route.meta?.title }}</h2>
          <p v-if="route.meta?.description">{{ route.meta.description }}</p>
          <ul v-if="route.meta?.tags" aria-label="Tags">
            <li v-for="tag in (route.meta.tags as string[])" :key="tag">{{ tag }}</li>
          </ul>
        </article>
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
    }
  }

  article {
    padding: var(--space-5);
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: var(--shadow);
    }

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
