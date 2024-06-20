<script setup lang="ts">
import { useStore } from "../composables/useStore";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const store = useStore();

const channels = ref<any[]>([]);
store.channels.then(data => {
   console.log("aaa", data);
   channels.value = data;
});
const active_channel = computed(() => store.active_channel);

const users = ref<any[]>([]);

onMounted(async () => {
   store.users.then(data => {
      users.value = data;
   });

   // set active channel to the id in the URL https://example.com/channels/t/1
   const route = useRoute();
   const path = route.path.split("/").at(-1);
   console.log("path", path);

   store.joinChannel(path[path.length - 1]);
});
</script>

<template>
   <div class="w-full h-full flex">
      <div id="sidebar" class="flex flex-col outline-right w-72 bg-blue-100">
         <div id="channels" class="flex flex-col gap-2 p-2">
            <div
               v-for="channel in channels"
               class="p-1 rounded-lg"
               :class="{ 'bg-blue-400': active_channel === channel }">
               <p class="hover:bg-blue-500 rounded-full p-2" @click="store.joinChannel(channel.id)">
                  {{ channel.name }}
                  <button class="" v-if="active_channel === channel" @click="store.leaveChannel()">
                     Leave
                  </button>
               </p>
               <div id="channel-users">
                  <div
                     v-for="user in channel.users"
                     class="bg-gray-600 outline outline-1 rounded-lg w-fit px-0.5 text-white">
                     {{ users.find(u => u.id === user)?.name }}
                  </div>
               </div>
            </div>
         </div>
      </div>
      <slot></slot>
   </div>
</template>

<style scoped lang="scss"></style>
