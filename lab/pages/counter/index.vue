<script setup lang="ts">
import { ref } from "vue";
import { NKLButton } from "@lab/design/components";

const count = ref(0);
</script>

<template>
  <NKLButton @click="count++">Count is {{ count }}</NKLButton>
</template>
