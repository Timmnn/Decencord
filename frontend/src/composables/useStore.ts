import { defineStore } from "pinia";
import type { Channel } from "../types";
import { WebSocketConnection } from "./useWSSync";
import { Peer, MediaConnection } from "peerjs";
import { useRouter } from "vue-router";

type Call = MediaConnection & { stream?: MediaStream };

export const useStore = defineStore("store", {
   state: () => ({
      // TODO: initialize empty and load from server
      _channels: [] as Channel[],
      // TODO: get user from server
      _user: null as { id: string; name: string } | null,
      peer: null as Peer | null,
      active_calls: [] as Call[],
      _users: [] as { id: string; name: string }[],
      ws_connection: new WebSocketConnection(),
      active_channel: null as Channel | null,
      _local_stream: null as MediaStream | null,
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

      async callEveryoneInChannel() {
         if (!this.active_channel) return;
         const user = await this.user;
         for (const user_id of this.active_channel.users) {
            if (user_id === user.id || this.active_calls.find(call => call.peer === user_id))
               continue;
            this.callUser(user_id);
         }
      },

      async leaveChannel() {
         const channel_id = this.active_channel?.id;
         const user = await this.user;

         this.ws_connection.sendEvent("leave_channel", { channel_id, user_id: user.id });
         this.active_channel = null;

         this.stopAllCalls();

         this.$router.push("/");
      },

      sendMessage(message: string) {
         this.ws_connection.sendEvent("send_message", {
            message,
            channel_id: this.active_channel?.id,
         });
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
         this.active_calls = this.active_calls.filter(call => call.peer !== user_id);
      },

      callUser(user_id: string) {
         console.log("calling user", user_id);
         if (!this.peer || this.peer.id === user_id) this.initPeer();

         user_id = user_id.toString();
         navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(stream => {
               if (!this.peer) throw new Error("Peer not initialized");
               const call = this.peer.call(user_id, stream) as Call;
               call.on("stream", remoteStream => {
                  console.log("got remote stream", remoteStream);
                  for (const c of this.active_calls) {
                     if (c.id === call.id) {
                        c.stream = remoteStream;
                     }
                  }
               });

               if (!this.active_calls.find(ex_call => ex_call.id === call.id)) {
                  this.active_calls.push(call);
               }
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

      async fetchMessages(channel_id: string) {
         return await fetch(`/api/v1/messages?channel_id=${channel_id}`)
            .then(res => res.json())
            .then(response => {
               return response.messages;
            });
      },

      async initPeer() {
         const user = await this.user;
         console.log("DBG_a init peer", user);
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
               })
               .catch(err => {
                  console.error("Failed to get local stream", err);
               });
         });
      },

      getUsername(user_id: string) {
         const user = this._users.find(user => user.id === user_id);
         return user?.name || "Unknown";
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
                  id: response.data.id,
                  name: response.data.username,
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
               console.log("got users", response.data);
               state._users = response.data.map((user: any) => ({
                  id: user.id,
                  name: user.username,
               }));
               return state._users;
            });
      },

      channels: async state => {
         if (state._channels.length > 0) return state._channels;
         console.log("fetching channels");
         return await fetch("/api/v1/channels")
            .then(res => res.json())
            .then(response => {
               console.log("got channels", response.data);

               state._channels = response.data;

               for (const channel of state._channels) {
                  if (channel.type === "text") {
                     fetch(`/api/v1/messages?channel_id=${channel.id}`)
                        .then(res => res.json())
                        .then(response => {
                           console.log("got messages", response.data);
                           channel.messages = response.data;
                        });
                  }
               }

               return state._channels;
            });
      },

      local_stream: async state => {
         if (state._local_stream) return state._local_stream;
         return await navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(stream => {
               state._local_stream = stream;
               return stream;
            })
            .catch(err => {
               console.error("Failed to get local stream", err);
            });
      },
   },
});
