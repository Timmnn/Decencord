// EchoWebsock.h
#pragma once
#include "lib/sessionManagement.h"
#include <drogon/WebSocketController.h>

using namespace drogon;
using namespace std;

class JsonFactory {
public:
  Json::Value result;

  static JsonFactory *init() {
    auto factory = new JsonFactory();
    return factory;
  }

  JsonFactory *add(string key, Json::Value value) {
    result[key] = value;
    return this;
  }

  JsonFactory *add(string key, vector<string> value) {
    for (auto &v : value) {
      result[key].append(v);
    }
    return this;
  }

  static Json::Value empty() { return Json::Value(Json::objectValue); }

  static Json::Value fromString(string str) {
    Json::Value json;
    Json::Reader reader;
    reader.parse(str, json);
    return json;
  }
};

class WebsocketController
    : public drogon::WebSocketController<WebsocketController, false> {
public:
  struct Connection {
    string session_id;
    shared_ptr<WebSocketConnection> connection;
  };
  vector<Connection> connections;
  map<string, vector<string>> channel_clients = {
      {"1", {}},
      {"2", {}},
  };
  void handleNewMessage(const WebSocketConnectionPtr &con, string &&msg,
                        const WebSocketMessageType &type) override {
    auto json_in = JsonFactory::fromString(msg);

    cout << "Received message: " << json_in.toStyledString() << endl;

    if (json_in["event"] == "join_channel") {
      handleJoinChannelMessage(con, json_in);
    } else if (json_in["event"] == "leave_channel") {
      handleLeaveChannelMessage(con, json_in);
    } else {
      cout << "Unknown event: " << json_in["event"].asString() << endl;
    }
  }

  void handleNewConnection(const HttpRequestPtr &req,
                           const WebSocketConnectionPtr &con) override {
    cout << "New connection" << endl;

    connections.push_back({req->session()->sessionId(), con});

    // inform about all channels content
    for (auto &channel : channel_clients) {
      auto channel_join_msg = generateChannelUpdateEvent(channel.first);
      con->send(channel_join_msg.toStyledString());
    }
  }

  void sendToAllClients(Json::Value &json) {
    cout << "Sending message to all clients: " << json.toStyledString() << endl;
    for (auto &connection : connections) {
      connection.connection->send(json.toStyledString());
    }
  }

  void handleConnectionClosed(const WebSocketConnectionPtr &con) override {
    cout << "Connection closed" << endl;

    for (auto it = connections.begin(); it != connections.end(); ++it) {
      if (it->connection == con) {
        connections.erase(it);
        break;
      }
    }
  }

  void handleJoinChannelMessage(const WebSocketConnectionPtr &con,
                                Json::Value &json_in) {
    string channel_id = json_in["data"]["channel_id"].asString();
    // find connected user
    string session_id;
    for (auto &c : connections) {
      if (c.connection == con) {
        session_id = c.session_id;
        break;
      }
    }
    string user_id = getUserFromSession(session_id).id;

    if (user_id.empty()) {
      cout << "User not found" << endl;
      return;
    }

    // find channel user is currently in

    for (auto &channel : channel_clients) {
      for (auto &client : channel.second) {
        if (client == user_id) {
          // remove user from channel
          channel.second.erase(
              remove(channel.second.begin(), channel.second.end(), user_id),
              channel.second.end());

          auto channel_leave_msg = generateChannelUpdateEvent(channel.first);

          sendToAllClients(channel_leave_msg);

          break;
        }
      }
    }

    // add user to channel
    channel_clients[channel_id].push_back(user_id);

    // send message to all clients

    auto channel_join_msg =
        JsonFactory::init()
            ->add("event", "channel_update")
            ->add("data", JsonFactory::init()
                              ->add("channel_id", channel_id)
                              ->add("users", channel_clients[channel_id])
                              ->result)
            ->result;

    sendToAllClients(channel_join_msg);
  }

  void handleLeaveChannelMessage(const WebSocketConnectionPtr &con,
                                 Json::Value &json_in) {
    string channel_id = json_in["data"]["channel_id"].asString();
    string user_id = json_in["data"]["user_id"].asString();

    // remove user from channel
    channel_clients[channel_id].erase(
        remove(channel_clients[channel_id].begin(),
               channel_clients[channel_id].end(), user_id),
        channel_clients[channel_id].end());

    // send message to all clients

    auto channel_leave_msg =
        JsonFactory::init()
            ->add("event", "channel_update")
            ->add("data", JsonFactory::init()
                              ->add("channel_id", channel_id)
                              ->add("users", channel_clients[channel_id])
                              ->result)
            ->result;

    sendToAllClients(channel_leave_msg);
  }

  Json::Value generateChannelUpdateEvent(string channel_id) {
    auto channel_join_msg =
        JsonFactory::init()
            ->add("event", "channel_update")
            ->add("data", JsonFactory::init()
                              ->add("channel_id", channel_id)
                              ->add("users", channel_clients[channel_id])
                              ->result)
            ->result;

    return channel_join_msg;
  }

  WS_PATH_LIST_BEGIN
  WS_PATH_ADD("/api/v1/ws");
  WS_PATH_LIST_END
};
