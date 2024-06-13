<script setup lang="ts">
type ChatMessageType = import("../types").ChatMessage;
import ChatMessage from "./ChatMessage.vue";
import { ref } from "vue";

const chat = ref<ChatMessageType[]>([
   {
      message: "Hello, world!",
      sender: "Alice",
      id: "1",
      timestamp: new Date(),
   },
]);
</script>

<template>
   <div class="chat">
      <h2>Chat</h2>
      <div v-for="message in chat" :key="message.id">
         <ChatMessage :message="message.message" :sender="message.sender" />
      </div>
   </div>
</template>

<style scoped lang="scss"></style>
