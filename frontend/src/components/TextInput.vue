<script setup lang="ts">
import { ref } from "vue";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const passwordVisible = ref(false);

defineProps<{
   modelValue: string;
   label: string;
   placeholder: string;
   type?: string;
}>();

defineEmits(["update:modelValue"]);
</script>

<template>
   <label class="flex flex-col w-60">
      {{ label }}
      <div
         class="flex items-center p-1 rounded focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 border border-gray-300"
         tabindex="">
         <input
            :value="modelValue"
            class="w-full focus:outline-none"
            :placeholder="placeholder"
            :type="passwordVisible && type === 'password' ? 'text' : type"
            @input="
               $emit(
                  'update:modelValue',
                  // @ts-ignore
                  $event.target.value
               )
            " />
         <FontAwesomeIcon
            @click="passwordVisible = !passwordVisible"
            :icon="passwordVisible ? faEyeSlash : faEye"
            v-if="type === 'password'"
            color="gray" />
      </div>
   </label>
</template>

<style scoped lang="scss"></style>
