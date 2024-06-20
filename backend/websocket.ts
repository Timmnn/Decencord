import WebSocket, { WebSocketServer } from "ws";
import pg_client from "./pg_client";
import state from "./global_state";

const wss = new WebSocketServer({
   port: 8091,
});

let ws_connections = [] as { ws: WebSocket; session_id: string }[];
let channel_users = {} as { [channel_id: number]: string[] };

async function getChannels() {
   const channels = await pg_client
      .asyncQuery("SELECT id FROM decencord_server.channels")
      .catch(err => {
         console.error(err);
         return [];
      });

   return channels.rows.map(channel => channel.id);
}

function generateChannelUpdateEvent(channel_id: string) {
   const users = channel_users[channel_id];

   console.log("Generating channel update event", channel_id, users);

   return {
      event: "channel_update",
      data: {
         channel_id,
         users,
      },
   };
}

function sendToAllClients(data: any) {
   ws_connections.forEach(con => {
      con.ws.send(JSON.stringify(data));
   });
}

async function getUserIdFromSession(session_id: string) {
   const user = await pg_client
      .asyncQuery("SELECT user_id FROM decencord_server.sessions WHERE id = $1", [session_id])
      .catch(err => {
         console.error(err);
         return null;
      });

   return user?.rows[0].user_id;
}

function parseCookies(cookie_string: string) {
   return cookie_string.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key.trim()] = value;
      return acc;
   }, {} as { [key: string]: string });
}

wss.on("connection", async function connection(ws, req) {
   console.log("Connection established");
   ws.on("WS Error", console.error);

   ws.on("message", async function message(data) {
      const json = JSON.parse(data.toString());
      console.log("Received message", json);
      const session_id = parseCookies(req.headers.cookie)["session_id"];
      handleEvent(json.event as Event, json.data, session_id);
   });

   ws.on("close", function close() {
      console.log("Connection closed");
      ws_connections = ws_connections.filter(conn => conn.ws !== ws);
   });

   ws_connections.push({ ws, session_id: parseCookies(req.headers.cookie)["session_id"] });

   const channels = await getChannels();
   channels.forEach(channel_id => {
      ws.send(JSON.stringify(generateChannelUpdateEvent(channel_id)));
   });
});

enum Event {
   JoinChannel = "join_channel",
   LeaveChannel = "leave_channel",
   SendMessage = "send_message",
}

function handleEvent(event: Event, data: any, session_id: string) {
   console.log("Handling event", event, data, session_id);
   switch (event) {
      case "join_channel":
         _handleJoinChannelEvent(data, session_id);
         break;
      case "leave_channel":
         break;
      case "send_message":
         _handleSendMessageEvent(data, session_id);
         break;
      default:
         console.log("Unknown event", event);
   }
}

async function _handleJoinChannelEvent(data: any, session_id: string) {
   console.log("Handling join channel event", data, session_id);
   const { channel_id } = data;
   const user_id = await getUserIdFromSession(session_id);
   const current_channel = Object.keys(channel_users).find(channel =>
      channel_users[channel].includes(user_id)
   );

   console.log("Joining channel", channel_id, current_channel);

   if (!channel_users[channel_id]) {
      channel_users[channel_id] = [];
   }
   channel_users[channel_id].push(user_id);

   if (current_channel) {
      channel_users[current_channel] = channel_users[current_channel].filter(id => id !== user_id);
      sendToAllClients(generateChannelUpdateEvent(parseInt(current_channel)));
   }

   console.log("Channel users", channel_users);
   sendToAllClients(generateChannelUpdateEvent(channel_id));
}

async function _handleSendMessageEvent(data: any, session_id: string) {
   const { channel_id, message } = data;
   const user_id = await getUserIdFromSession(session_id);

   console.log("Handling send message event", data, session_id);

   const channel = channel_users[channel_id];
   if (!channel) {
      console.error("Channel not found", channel_id);
      return;
   }

   console.log("Sending message to channel", channel_id, message);

   await pg_client
      .asyncQuery(
         "INSERT INTO decencord_server.messages (channel_id, user_id, content) VALUES ($1, $2, $3)",
         [channel_id, user_id, message]
      )
      .then(() => {
         sendToAllClients({
            event: "new_message",
            data: {
               channel_id,
               user_id,
               message,
            },
         });
      });
}

export default wss;
