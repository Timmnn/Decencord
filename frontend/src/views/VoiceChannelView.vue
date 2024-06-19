<script setup lang="ts">
import { useStore } from "../composables/useStore";
import { ref, onMounted } from "vue";

const store = useStore();

const localStreamVideo = ref<HTMLVideoElement | null>(null);
const remoteStreamVideo = ref<HTMLVideoElement | null>(null);

function onIncomingCall(local_stream: MediaStream, remote_stream: MediaStream) {
   if (localStreamVideo.value) {
      localStreamVideo.value.srcObject = local_stream;
   }
   if (remoteStreamVideo.value) {
      remoteStreamVideo.value.srcObject = remote_stream;
   }
}

onMounted(() => {
   store.initPeer();
});

store.setIncomingCallCallback(onIncomingCall);
</script>

<template>
   <video ref="localStreamVideo" autoplay class="outline w-1/3 h-1/3"></video>
   <video ref="remoteStreamVideo" autoplay class="outline w-1/3 h-1/3"></video>
</template>

<style scoped lang="scss"></style>
