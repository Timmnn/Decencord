<script setup lang="ts">
import { useStore } from "../composables/useStore";
import { ref, watch } from "vue";

const store = useStore();

const local_stream = ref<MediaStream | null>(null);
store.local_stream.then(stream => {
   if (!stream) return;
   local_stream.value = stream;
});

const active_calls = ref(store.active_calls);

watch(store.active_calls, () => {
   console.log("Watch active_calls", store.active_calls);
   active_calls.value = store.active_calls;
});
</script>

<template>
   <div class="flex flex-col p-5 grow gap-5 items-start">
      <video autoplay :srcObject="local_stream" class="outline rounded basis-0"></video>
      <video
         v-for="video in store.active_calls"
         autoplay
         :srcObject="video.stream"
         class="outline rounded basis-0"></video>
   </div>
</template>

<style scoped lang="scss">
video {
   max-height: 100%;
   max-width: 100%;
   aspect-ratio: 4/3;
}
</style>
