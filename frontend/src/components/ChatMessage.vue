<script setup lang="ts">
const props = defineProps<{
   message: string;
   sender: string;
   clientUsername: string;
}>();
</script>

<template>
   <div class="chat-message" :class="{ 'sent-by-me': props.sender === props.clientUsername }">
      <h3>{{ props.sender }}</h3>
      <p>{{ props.message }}</p>
   </div>
</template>

<style scoped lang="scss">
.chat-message {
   border: 1px solid black;
   margin: 1rem;

   &.sent-by-me {
      background-color: rgb(47, 47, 47);
   }
}
</style>
