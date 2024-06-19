import { useStore } from "./useStore";

export class WebSocketConnection {
   ws: WebSocket | null = null;
   event_listeners: Record<string, ((data: object) => void)[]> = {};

   connect(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
         if (this.ws) return resolve();

         this.ws = new WebSocket("wss://" + window.location.host + "/api/v1/ws");

         this.ws!.onopen = () => resolve();
         this.ws!.onerror = err => reject(err);
         this.ws!.onmessage = this.onMessage.bind(this);
      });
   }

   async send(messsge: string | object) {
      await this.connect()
         .then(() => {
            const message_string = typeof messsge === "string" ? messsge : JSON.stringify(messsge);
            this.ws!.send(message_string);
         })
         .catch(err => {
            console.error("Failed to connect to WebSocket server", err);
         });
   }

   async sendEvent(event: string, data: object) {
      await this.send(JSON.stringify({ event, data }));
   }

   private onMessage(event: MessageEvent) {
      const { event: message_event, data } = JSON.parse(event.data) as {
         event: string;
         data: object;
      };
      if (!this.event_listeners[message_event]) return;

      this.event_listeners[message_event].forEach(callback => callback(data));
   }

   addEventListener(event: string, callback: (data: any) => void) {
      if (!this.event_listeners[event]) this.event_listeners[event] = [];
      this.event_listeners[event].push(callback);

      return this;
   }
}

export async function useWSSync() {
   const store = useStore();
   await store.ws_connection.connect();

   store.ws_connection.addEventListener(
      "channel_update",
      async (data: { channel_id: string; users: string[] }) => {
         const channels = await store.channels;
         const channel = channels.find(channel => channel.id === data.channel_id);
         if (!channel)
            throw new Error(
               "Channel not found, id: " +
                  data.channel_id +
                  " expected one of: " +
                  store.channels.map(channel => channel.id).join(", ")
            );

         const leaving_users = new Set(channel.users);
         leaving_users.forEach(user_id => store.stopCall(user_id));

         channel.users = new Set(data.users);

         const user = await store.user;

         if (channel.users.has(user.id)) {
            store.active_channel = channel;
         }
      }
   );

   store.ws_connection.addEventListener("channels", (data: { channels: Channel[] }) => {
      store.channels = data.channels;
   });
}
