<script setup lang="ts">
import { Peer } from "peerjs";
import { ref, onMounted } from "vue";

const remote_video = ref<HTMLVideoElement | null>(null);

const peer = ref<Peer | null>(null);

const user = ref<string>("");

const ws_connection = ref<WebSocket | null>(null);

interface Room {
   name: string;
   users: Set<string>;
}

const rooms = ref<Room[]>([
   {
      name: "Room 1",
      users: new Set(),
   },
   {
      name: "Room 2",
      users: new Set(),
   },
]);

onMounted(() => {
   ws_connection.value = new WebSocket(
      "wss://" + window.location.hostname + ":" + window.location.port + "/api/v1/ws"
   );

   ws_connection.value.onopen = () => {
      console.log("Connected to the WS server");
   };

   ws_connection.value.onmessage = event => {
      const data = JSON.parse(event.data);

      if (data.type === "join") {
         const room = rooms.value.find(r => r.name === data.room);
         if (room) {
            userChangedRoom(room, data.user);
         }
      }
   };
});

function userChangedRoom(room: Room, user: string) {
   const current_room = rooms.value.find(r => r.users.has(user));
   current_room?.users.delete(user);
   room.users.add(user);
}

function createPeer(id: string) {
   return;
   peer.value = new Peer(id, {
      host: window.location.hostname,
      path: "/peer-server",
   });
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

   const current_room = rooms.value.find(r => r.users.has(user.value));
   current_room?.users.delete(user.value);

   userChangedRoom(room, user.value);

   //TODO: user shouldnt be set by the client
   ws_connection.value?.send(JSON.stringify({ type: "join", user: user.value, room: room.name }));
}
</script>

<template>
   <div>
      <input type="text" name="" v-model="user" placeholder="Your Name" />

      <video autoplay ref="remote_video"></video>

      <h2>Rooms</h2>
      <div class="flex flex-col gap-2">
         <div class="outline w-fit p-2 rounded" v-for="room in rooms">
            <h3>{{ room.name }}</h3>
            <div class="flex flex-col gap-1">
               <div v-for="user in room.users" class="outline outline-red-400">{{ user }}</div>
            </div>
            <button class="btn" @click="join_room(room)">Join</button>
            <div></div>
         </div>
      </div>
   </div>
</template>

<style scoped lang="scss"></style>
