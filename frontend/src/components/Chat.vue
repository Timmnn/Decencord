<script setup lang="ts">
type ChatMessageType = import("../types").ChatMessage;
import ChatMessage from "./ChatMessage.vue";
import { ref, onMounted, computed } from "vue";
import { useStore } from "../composables/useStore";

const store = useStore();

const me = ref<string>("");
store.user.then(user => {
   if (!user) return;
   me.value = user.id;
});

const message_draft = ref<string>("");

const chat = ref<ChatMessageType[]>([]);

const messages = computed(() => store.active_channel?.messages);

async function sendMessage() {
   store.sendMessage(message_draft.value);

   message_draft.value = "";
}
</script>

<template>
   <div class="grow flex flex-col">
      <h2>Chat</h2>
      <div class="gap-3 flex-col grow justify-end min-h-0 overflow-auto px-3">
         <div v-for="message in messages" :key="message.id" class="mb-3">
            <ChatMessage
               :content="message.content"
               :sender="message.user_id"
               :client-id="me"></ChatMessage>
         </div>
      </div>
      <div class="flex gap-3">
         <input
            type="text"
            placeholder="Type a message..."
            v-model="message_draft"
            class="border rounded p-1" />
         <button @click="sendMessage" class="bg-blue-700 p-3 rounded text-white">Send</button>
      </div>
   </div>
</template>

<style scoped lang="scss"></style>
