<script setup lang="ts">
defineProps<{
   error: string | null;
}>();
</script>

<template>
   <div v-if="error" class="text-red-500">{{ error }}</div>
</template>

<style scoped lang="scss"></style>
