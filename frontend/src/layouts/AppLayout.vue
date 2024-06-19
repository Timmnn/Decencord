<script setup lang="ts">
import { useStore } from "../composables/useStore";
import { computed, onMounted, ref } from "vue";

const store = useStore();

const channels = ref<any[]>([]);

const active_channel = computed(() => store.active_channel);

const users = ref<any[]>([]);

onMounted(async () => {
   store.users.then(data => {
      users.value = data;
   });

   store.channels.then(data => {
      channels.value = data;
   });
});
</script>

<template>
   <div class="w-full h-full flex">
      <div id="sidebar" class="flex flex-col outline-right w-72 bg-blue-100">
         <div id="channels" class="flex flex-col gap-2">
            <div
               v-for="channel in channels"
               class="hover:bg-blue-300 bg-blue-200 p-1"
               :class="{ 'bg-blue-200': active_channel === channel }">
               <span
                  >{{ channel.name }}

                  <button
                     class="btn"
                     v-if="active_channel !== channel"
                     @click="store.joinChannel(channel.id)">
                     Join
                  </button>
                  <button
                     class="btn"
                     v-if="active_channel === channel"
                     @click="store.leaveChannel()">
                     Leave
                  </button>
               </span>
               <div id="channel-users">
                  <div
                     v-for="user in channel.users"
                     class="bg-blue-500 outline rounded-lg w-fit p-0.5">
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
