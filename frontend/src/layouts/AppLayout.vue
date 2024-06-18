<script setup lang="ts">
import { useStore } from "../composables/useStore";

const store = useStore();

const channels = store.channels;

const active_channel = store.active_channel;
</script>

<template>
   <div class="w-full h-full flex">
      <div id="sidebar" class="flex flex-col outline-right w-72 bg-blue-100">
         <div id="channels" class="flex flex-col gap-2">
            <div
               v-for="channel in channels"
               class="hover:bg-blue-200 p-1"
               :class="{ 'bg-blue-200': active_channel === channel }"
               @click="store.joinChannel(channel.id)">
               {{ channel.name }}
               <div id="channel-users">
                  <div
                     v-for="user in channel.users"
                     class="bg-blue-500 outline rounded-lg w-fit p-0.5">
                     {{ user }}
                  </div>
               </div>
            </div>
         </div>
      </div>
      <slot></slot>
   </div>
</template>

<style scoped lang="scss"></style>
