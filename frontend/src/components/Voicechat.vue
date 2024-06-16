<script setup lang="ts">
import { ref } from "vue";

const mediaRecorder = ref<MediaRecorder | null>(null);
const chunks = ref<Blob[]>([]);

function startRecording() {
   if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia is not supported");
      return;
   }

   navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
         console.log("Recording started");
         mediaRecorder.value = new MediaRecorder(stream);
         mediaRecorder.value.start(5000);

         mediaRecorder.value.ondataavailable = e => {
            chunks.value.push(e.data);
            console.log("Data available", e.data);

            // encode blob as base64
            const reader = new FileReader();
            reader.onload = () => {
               const base64 = reader.result as string;
               console.log("Base64", base64);
            };
            reader.readAsDataURL(e.data);
         };
      })
      .catch(err => {
         console.log("Failed to start recording", err);
      });
}

function stopRecording() {
   if (mediaRecorder.value) {
      mediaRecorder.value.stop();
      console.log("Recording stopped");

      const blob = new Blob(chunks.value, { type: "audio/ogg; codecs=opus" });
      const url = URL.createObjectURL(blob);
      console.log("Recording URL", url);

      const audio = new Audio(url);
      audio.play();

      // download the recording
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.ogg";
      a.click();
   }
}
</script>

<template>
   <div>
      <h1>Voicechat</h1>
      <button @click="startRecording">Start Recording</button>
      <button @click="stopRecording">Stop Recording</button>
   </div>
</template>

<style scoped lang="scss"></style>
