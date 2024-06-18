import { defineStore } from "pinia";
import type { Channel } from "../types";
import { WebSocketConnection } from "./useWSSync";
import { Peer } from "peerjs";
export const useStore = defineStore("store", {
   state: () => ({
      // TODO: initialize empty and load from server
      channels: [
         {
            name: "Text Channel 1",
            type: "text",
            id: "1",
            users: new Set(),
         },
         {
            name: "Voice Channel 1",
            type: "voice",
            id: "2",
            users: new Set(),
         },
      ] as Channel[],
      // TODO: get user from server
      user: {
         id: "1",
         name: "Timm",
      },
      peer: null as Peer | null,
      call: null as MediaStream | null,
      users: [] as Peer[],
      ws_connection: new WebSocketConnection(),
      active_channel: null as Channel | null,
      incoming_call_callback: null as
         | ((local_stream: MediaStream, remote_stream: MediaStream) => void)
         | null,
   }),
   actions: {
      joinChannel(channel_id: string) {
         if (!this.peer) this.initPeer();
         //TODO: insecure. user_id should be set server-side
         this.ws_connection.sendEvent("join_channel", { channel_id, user_id: this.user.id });

         const channel = this.channels.find(channel => channel.id === channel_id);

         for (const user of channel?.users || []) {
            this.callUser(user);
         }
      },

      leaveChannel(channel_id: string) {
         this.ws_connection.sendEvent("leave_channel", { channel_id, user_id: this.user.id });
      },

      callUser(user_id: string) {
         console.log("calling user", user_id);
         if (!this.peer || this.peer.id === user_id) this.initPeer();

         navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(stream => {
               const call = this.peer.call(user_id, stream);
               call.on("stream", remoteStream => {
                  console.log("got remote stream", remoteStream);
                  if (this.incoming_call_callback)
                     this.incoming_call_callback(stream, remoteStream);
               });
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

      initPeer() {
         this.peer = new Peer(this.user.id, {
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
});
