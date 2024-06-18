<script setup lang="ts">
import { useWSSync } from "./composables/useWSSync";

useWSSync();
</script>

<template>
   <component :is="$router.currentRoute.value.meta.layout">
      <router-view />
   </component>
</template>

<style scoped lang="scss"></style>
