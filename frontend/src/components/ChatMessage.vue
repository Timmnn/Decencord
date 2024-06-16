<script setup lang="ts">
const props = defineProps<{
   content: string;
   sender: string;
   clientUsername: string;
}>();
</script>

<template>
   <div class="flex justify-end" :class="{ 'justify-start text-3xl': props.sender === props.clientUsername,
   'justify-end': props.sender !== props.clientUsername
    }">
      <div class="bg-blue-500 rounded p-1 text-white">
         <h3>{{ props.sender }}</h3>
      <p>{{ props.content }}</p>
      </div>
   </div>
</template>

<style scoped lang="scss">

</style>
