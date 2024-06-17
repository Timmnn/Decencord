<script setup lang="ts">
import { Peer } from "peerjs";
import { ref, onMounted } from "vue";

const remote_video = ref<HTMLVideoElement | null>(null);

const called_id = ref<string>("");
const peer = ref<Peer | null>(null);
const peer_id = ref<string>("");

const user = ref<string>("");

interface Room {
   name: string;
   users: string[];
}

const rooms = ref<Room[]>([
   {
      name: "Room 1",
      users: ["User 1", "User 2", "User 3"],
   },
   {
      name: "Room 2",
      users: ["User 4", "User 5", "User 6"],
   },
]);

function createPeer(id: string) {
   peer.value = new Peer(id);
   peer.value.on("call", call => {
      navigator.mediaDevices
         .getUserMedia({ video: true, audio: true })
         .then(stream => {
            call.answer(stream); // Answer the call with an A/V stream.
            call.on("stream", remoteStream => {
               // Show stream in some <video> element.

               if (remote_video.value) {
                  remote_video.value.srcObject = remoteStream;
               }
            });
         })
         .catch(err => {
            console.error("Failed to get local stream", err);
         });
   });
}

function join_room(room: Room) {
   console.log("Joining room", room);

   createPeer(user.value + room.name);

   for (const user of room.users) {
      call(user);
   }

   room.users.push(user.value);
}

function call(id: string) {
   navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
         const call = peer.value.call(id, stream);
         call.on("stream", remoteStream => {
            // Show stream in some <video> element.
            if (remote_video.value) {
               remote_video.value.srcObject = remoteStream;
            }
         });
      })
      .catch(err => {
         console.error("Failed to get local stream", err);
      });
}
</script>

<template>
   <div>
      <input type="text" name="" v-model="user" placeholder="Your Name" />
      <h1>Voicechat</h1>

      <input type="text" name="" id="peer_id" v-model="peer_id" placeholder="Your ID" />

      <input type="text" name="" id="call_id" v-model="called_id" placeholder="Call ID" />

      <button class="btn" @click="createPeer">Create Peer</button>

      <button class="btn" @click="call">Start Call</button>

      <video autoplay ref="remote_video"></video>

      <h2>Rooms</h2>
      <div class="flex flex-col gap-2">
         <div class="outline w-fit p-2 rounded" v-for="room in rooms">
            <h3>{{ room.name }}</h3>
            <div class="flex flex-col gap-1">
               <div v-for="user in room.users" class="outline outline-red-400">{{ user }}</div>
            </div>
            <button class="btn">Join</button>
            <div></div>
         </div>
      </div>
   </div>
</template>

<style scoped lang="scss"></style>
