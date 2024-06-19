<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "../composables/useStore";
const store = useStore();

const channel = computed(() => store.active_channel);
</script>

<template>
   {{ channel }}
</template>

<style scoped lang="scss"></style>
