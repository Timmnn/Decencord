<script setup lang="ts">
type ChatMessageType = import("../types").ChatMessage;
import ChatMessage from "./ChatMessage.vue";
import { ref } from "vue";

const me = "Bob";

const message_draft = ref<string>("");

const chat = ref<ChatMessageType[]>([
   {
      message: "Hello, world!",
      sender: "Alice",
      id: "1",
      timestamp: new Date(),
   },
   {
      message: "Hi, Alice!",
      sender: "Bob",
      id: "2",
      timestamp: new Date(),
   },
   {
      message: "How are you?",
      sender: "Alice",
      id: "3",
      timestamp: new Date(),
   },
   {
      message: "I'm good, thanks!",
      sender: "Bob",
      id: "4",
      timestamp: new Date(),
   },
   {
      message: "How about you?",
      sender: "Bob",
      id: "5",
      timestamp: new Date(),
   },
   {
      message: "I'm good too!",
      sender: "Alice",
      id: "6",
      timestamp: new Date(),
   },
]);

function sendMessage() {
   const new_message: ChatMessageType = {
      message: message_draft.value,
      sender: me,
      id: chat.value.length.toString(),
      timestamp: new Date(),
   };

   fetch("http://localhost:8090/chat/", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         message: new_message.message,
      }),
   });

   message_draft.value = "";
}
</script>

<template>
   <div class="chat">
      <h2>Chat</h2>
      <div v-for="message in chat" :key="message.id">
         <ChatMessage :message="message.message" :sender="message.sender" :client-username="me" />
      </div>

      <input type="text" placeholder="Type a message..." v-model="message_draft" />
      <button @click="sendMessage">Send</button>
   </div>
</template>

<style scoped lang="scss"></style>
