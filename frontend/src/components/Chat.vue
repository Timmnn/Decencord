<script setup lang="ts">
type ChatMessageType = import("../types").ChatMessage;
import ChatMessage from "./ChatMessage.vue";
import { ref, onMounted } from "vue";

const me = "Bob";

const message_draft = ref<string>("");

const chat = ref<ChatMessageType[]>([]);

function fetchMessages() {
   fetch("/api/v1/messages", {
      method: "GET",
   })
      .then(response => response.json())
      .then(data => {
         console.log(data);
         chat.value = data.messages;
      });
}

onMounted(() => {
   fetchMessages();
});

async function sendMessage() {
   // Create a new message object temporarily
   const new_message: ChatMessageType = {
      content: message_draft.value,
      user_id: me,
      id: chat.value.length.toString(),
      created_at: new Date(),
   };

   chat.value.push(new_message);

   const returned_message = await fetch("/api/v1/messages", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         content: new_message.content,
      }),
   }).then(response => response.json());

   // Replace the temporary message with the returned message
   chat.value[chat.value.length - 1] = returned_message;

   message_draft.value = "";
}
</script>

<template>
   <div class="chat">
      <h2>Chat</h2>
      <div class="flex gap-3 flex-col">
         <div v-for="message in chat" :key="message.id">
            <ChatMessage :content="message.content" :sender="message.user_id" :client-username="me" />
         </div>
      </div>
      <div class="flex gap-3">
         <input type="text" placeholder="Type a message..." v-model="message_draft" class="border rounded p-1" />
      <button @click="sendMessage" class="bg-blue-700 p-3 rounded text-white">Send</button>
      </div>
   </div>
</template>

<style scoped lang="scss"></style>
