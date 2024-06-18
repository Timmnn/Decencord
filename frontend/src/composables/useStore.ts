import { defineStore } from "pinia";
import type { Channel } from "../types";
import { WebSocketConnection } from "./useWSSync";
export const useStore = defineStore("store", {
   state: () => ({
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
      user: {
         id: "1",
         name: "Timm",
      },
      users: [] as { id: string; name: string }[],
      ws_connection: new WebSocketConnection(),
      active_channel: null as Channel | null,
   }),
   actions: {
      joinChannel(channel_id: string) {
         //TODO: insecure. user_id should be set server-side
         this.ws_connection.sendEvent("join_channel", { channel_id, user_id: this.user.id });
      },
   },
});
