<script setup lang="ts">
defineProps<{ label: string }>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input v-model="model" type="text" />
  </label>
</template>

<style scoped src="./field.css"></style>
