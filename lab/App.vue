<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import ColumnLayout from "./layouts/ColumnLayout.vue";
import { labPageOf } from "./pages/meta";

const route = useRoute();
const page = computed(() => labPageOf(route.name));
</script>

<template>
  <RouterView v-slot="{ Component }">
    <ColumnLayout
      v-if="page !== undefined && page.layout !== 'fullscreen'"
      :title="page.title"
      :width="page.layout"
    >
      <component :is="Component" />
    </ColumnLayout>
    <component :is="Component" v-else />
  </RouterView>
</template>
