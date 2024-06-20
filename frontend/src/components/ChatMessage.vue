<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "../composables/useStore";

const store = useStore();
const props = defineProps<{
   content: string;
   sender: string;
   clientId: string;
}>();

const sent_by_me = computed(() => props.sender === props.clientId);
</script>

<template>
   <div class="flex" :class="sent_by_me ? 'justify-end' : 'justify-start'">
      <div
         class="bg-blue-500 rounded p-1 text-white"
         :class="sent_by_me ? 'bg-blue-500' : 'bg-gray-500'">
         <h3>{{ store.getUsername(props.sender) }}</h3>
         <p>{{ props.content }}</p>
      </div>
   </div>
</template>

<style scoped lang="scss"></style>
