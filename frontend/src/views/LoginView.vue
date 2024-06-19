<script setup lang="ts">
import { ref } from "vue";
import TextInput from "../components/TextInput.vue";
import FormError from "../components/FormError.vue";

const error = ref<string | null>(null);
const form_data = ref({
   username: "",
   password: "",
});

function login() {
   error.value = null;
   if (!form_data.value.username || !form_data.value.password) {
      error.value = "Please fill in all fields.";
      return;
   }

   fetch("/api/v1/login", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify(form_data.value),
   })
      .then(res => {
         if (res.ok) {
            return res.json();
         } else {
            error.value = "Invalid username or password.";
         }
      })
      .then(data => {
         console.log(data);
      })
      .catch(err => {
         error.value = err.message;
      });
}
</script>

<template>
   <div class="flex flex-col items-center gap-4">
      <h1 class="text-3xl">Login</h1>
      <form
         @submit.prevent="login"
         class="outline outline-1 outline-gray-500 rounded gap-2 flex flex-col p-3">
         <TextInput v-model="form_data.username" placeholder="Username" label="Username" />
         <TextInput
            v-model="form_data.password"
            placeholder="Password"
            label="Password"
            type="password" />
         <button class="btn" type="submit">Login</button>
         <FormError v-if="error" :error="error" />
      </form>
   </div>
</template>

<style scoped lang="scss"></style>
