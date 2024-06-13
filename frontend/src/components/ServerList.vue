<script lang="ts" setup>
const servers = [
   {
      url: "http://localhost:8090",
      id: 1,
   },
];
</script>

<template>
   <div class="servers">
      <h2>Servers</h2>
      <ul>
         <li v-for="server in servers" :key="server.id">
            <h3>{{ server.url }}</h3>
         </li>
      </ul>
   </div>
</template>

<style scoped lang="scss"></style>
