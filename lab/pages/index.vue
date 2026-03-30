<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { computed } from "vue";

const router = useRouter();
const labPages = computed(() => router.getRoutes().filter((r) => r.name !== "/" && r.meta?.title));
</script>

<template>
  <div class="home">
    <h1>Lab</h1>
    <div class="grid">
      <RouterLink v-for="route in labPages" :key="route.name" :to="route.path" class="card">
        <h2>{{ route.meta?.title }}</h2>
        <p v-if="route.meta?.description">{{ route.meta.description }}</p>
        <div v-if="route.meta?.tags" class="tags">
          <span v-for="tag in route.meta.tags as string[]" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 32px 24px;
}

h1 {
  margin: 0 0 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card {
  display: block;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--shadow);
}

.card h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

.card p {
  color: var(--text);
  font-size: 14px;
}

.tags {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--accent-bg);
  color: var(--accent);
}
</style>
