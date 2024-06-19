import { defineStore } from "pinia";
import type { Channel } from "../types";
import { WebSocketConnection } from "./useWSSync";
import { Peer, MediaConnection } from "peerjs";
import { useRouter } from "vue-router";
export const useStore = defineStore("store", {
   state: () => ({
      // TODO: initialize empty and load from server
      _channels: [] as Channel[],
      // TODO: get user from server
      _user: null as { id: string; name: string } | null,
      peer: null as Peer | null,
      active_calls: [] as MediaConnection[],
      _users: [] as { id: string; name: string }[],
      ws_connection: new WebSocketConnection(),
      active_channel: null as Channel | null,
      incoming_call_callback: null as
         | ((local_stream: MediaStream, remote_stream: MediaStream) => void)
         | null,
   }),
   actions: {
      async joinChannel(channel_id: string) {
         if (!this.peer) this.initPeer();
         //TODO: insecure. user_id should be set server-side
         this.stopAllCalls();
         this.ws_connection.sendEvent("join_channel", {
            channel_id,
            user_id: this.user.id,
         });

         const channels = await this.channels;

         const channel = channels.find(channel => channel.id === channel_id);

         for (const user of channel?.users || []) {
            this.callUser(user);
         }

         const channel_type = channel?.type === "voice" ? "v" : "t";

         this.$router.push(`/channels/${channel_type}/${channel_id}`);
      },

      async leaveChannel() {
         const channel_id = this.active_channel?.id;
         const user = await this.user;

         this.ws_connection.sendEvent("leave_channel", { channel_id, user_id: user.id });
         this.active_channel = null;

         this.stopAllCalls();

         this.$router.push("/");
      },

      stopAllCalls() {
         for (const call of this.active_calls) {
            call.close();
         }
         this.active_calls = [];
      },

      stopCall(user_id: string) {
         const call = this.active_calls.find(call => call.peer === user_id);
         if (call) call.close();
      },

      callUser(user_id: string) {
         console.log("calling user", user_id);
         if (!this.peer || this.peer.id === user_id) this.initPeer();

         navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(stream => {
               if (!this.peer) throw new Error("Peer not initialized");
               const call = this.peer.call(user_id, stream);
               call.on("stream", remoteStream => {
                  console.log("got remote stream", remoteStream);
                  if (this.incoming_call_callback)
                     this.incoming_call_callback(stream, remoteStream);
               });

               this.active_calls.push(call);
            })
            .catch(err => {
               console.error("Failed to get local stream", err);
            });
      },

      setIncomingCallCallback(
         callback: (local_stream: MediaStream, remote_stream: MediaStream) => void
      ) {
         this.incoming_call_callback = callback;
      },

      async initPeer() {
         const user = await this.user;
         console.log("DBG_A init peer", user.id);
         this.peer = new Peer(user.id, {
            host: window.location.hostname,
            path: "/peer-server",
         });

         this.peer.on("call", call => {
            navigator.mediaDevices
               .getUserMedia({ video: true, audio: true })
               .then(stream => {
                  call.answer(stream); // Answer the call with an A/V stream.
                  call.on("stream", remoteStream => {
                     if (this.incoming_call_callback)
                        this.incoming_call_callback(stream, remoteStream);
                  });
               })
               .catch(err => {
                  console.error("Failed to get local stream", err);
               });
         });
      },
   },

   getters: {
      user: async state => {
         console.log("getting user", state._user);
         if (state._user) return state._user;
         return await fetch("/api/v1/user")
            .then(res => res.json())
            .then(response => {
               console.log("got user", response);
               state._user = {
                  id: response.user_id,
                  name: response.username,
               };
               return state._user;
            })
            .catch(err => {
               console.error("Failed to get user", err);
               if (err.status === 401 || err.status === 403) {
                  const router = useRouter();
                  router.push("/login");
               }
            });
      },

      users: async state => {
         if (state._users.length > 0) return state._users;
         return await fetch("/api/v1/users")
            .then(res => res.json())

            .then(response => {
               console.log("got users", response.users);
               state._users = response.users.map((user: any) => ({
                  id: user.id,
                  name: user.username,
               }));
               return state._users;
            });
      },

      channels: async state => {
         if (state._channels.length > 0) return state._channels;
         return await fetch("/api/v1/channels")
            .then(res => res.json())
            .then(response => {
               console.log("got channels", response.channels);
               state._channels = response.channels;
               return state._channels;
            });
      },
   },
});
