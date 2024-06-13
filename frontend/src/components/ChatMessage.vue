<script setup lang="ts">
const props = defineProps<{
   message: string;
   sender: string;
}>();
</script>

<template>
   <div class="chat-message">
      <h3>{{ props.sender }}</h3>
      <p>{{ props.message }}</p>
   </div>
</template>

<style scoped lang="scss"></style>
