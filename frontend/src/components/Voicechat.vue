<script setup lang="ts">
import { ref } from "vue";
import useRTC from "../composables/useRTC";

const rtc = useRTC();

function startCall() {
   rtc.startLocalStream();
}

function getOffers() {
   rtc.fetchOffers();
}
</script>

<template>
   <div>
      <h1>Voicechat</h1>
      <button @click="startCall">Start Call</button>
      <button @click="getOffers">Get Offers</button>
   </div>
</template>

<style scoped lang="scss"></style>
