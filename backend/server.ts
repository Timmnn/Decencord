import express from "express";
import { PeerServer } from "peer";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import pg_client from "./pg_client.ts";
import wss from "./websocket.ts";
import state from "./global_state.ts";

const peerServer = PeerServer({ port: 1234, path: "/peer-server" });

console.log(wss);

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.get("/api/v1/", (req: express.Request, res: express.Response) => {
   res.send("Hello World");
});

app.get("/api/v1/messages", async (req: express.Request, res: express.Response) => {
   const messages = await pg_client
      .asyncQuery("SELECT * FROM decencord_server.messages WHERE channel_id = $1", [
         req.query.channel_id,
      ])
      .catch(err => {
         console.error(err);

         res.status(500).json({
            type: "error",
            message: "Internal Server Error",
         });
      });

   if (!messages) {
      return;
   }

   res.json({
      type: "success",
      data: messages.rows,
   });
});

app.get("/api/v1/user", async (req: express.Request, res: express.Response) => {
   const session_id = req.cookies["session_id"];

   const user_id = await pg_client
      .asyncQuery("SELECT user_id FROM decencord_server.sessions WHERE id = $1", [session_id])
      .catch(err => {
         console.error(err);
         res.status(500).json({
            type: "error",
            message: "Internal Server Error",
         });
      });

   if (user_id.rows?.length === 0) {
      res.status(401).json({
         type: "error",
         message: "Unauthorized",
      });
      return;
   }

   const user = await pg_client.asyncQuery(
      "SELECT id, username FROM decencord_server.users WHERE id = $1",
      [user_id.rows[0].user_id]
   );

   if (user.rows?.length === 0) {
      res.status(500).json({
         type: "error",
         message: "Internal Server Error",
      });
      return;
   }

   res.json({
      type: "success",
      data: user.rows[0],
   });
});

app.get("/api/v1/users", async (req: express.Request, res: express.Response) => {
   const users = await pg_client
      .asyncQuery("SELECT id, username FROM decencord_server.users")
      .catch(err => {
         console.error(err);
         res.status(500).send("Internal Server Error");
      });

   if (!users) {
      return;
   }

   console.log(users.rows);

   res.json({
      type: "success",
      data: users.rows,
   });
});

app.get("/api/v1/channels", async (req: express.Request, res: express.Response) => {
   const channels = await pg_client
      .asyncQuery("SELECT * FROM decencord_server.channels")
      .catch(err => {
         console.error(err);

         res.status(500).json({
            type: "error",
            message: "Internal Server Error",
         });
      });

   if (!channels) {
      return;
   }

   res.json({
      type: "success",
      data: channels.rows.map(channel => ({
         users: state.channel_users[channel.id],
         ...channel,
      })),
   });
});

app.post("/api/v1/login", async (req: express.Request, res: express.Response) => {
   const { username, password } = req.body;

   const user = await pg_client
      .asyncQuery("SELECT * FROM decencord_server.users WHERE username = $1 AND password = $2", [
         username,
         password,
      ])
      .catch(err => {
         console.error(err);

         res.status(500).json({
            type: "error",
            message: "Internal Server Error",
         });
      });

   if (!user) {
      return;
   }

   if (user.rows.length === 0) {
      res.status(401).json({
         type: "error",
         message: "Invalid username or password",
      });
      return;
   }

   const session_id = Math.random().toString(36).substring(2, 15);

   await pg_client.asyncQuery(
      "INSERT INTO decencord_server.sessions (id, user_id) VALUES ($1, $2)",
      [session_id, user.rows[0].id]
   );

   res.cookie("session_id", session_id, {
      httpOnly: true,
   });

   res.json({
      type: "success",
      data: {
         session_id,
      },
   });
});

app.listen(8090, () => {
   console.log("Server is running on port 8090");
});
