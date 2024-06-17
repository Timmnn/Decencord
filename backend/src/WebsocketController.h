// EchoWebsock.h
#pragma once
#include <drogon/WebSocketController.h>
using namespace drogon;
class WebsocketController
    : public drogon::WebSocketController<WebsocketController, false> {
public:
  void handleNewMessage(const WebSocketConnectionPtr &con, std::string &&msg,
                        const WebSocketMessageType &type) override {
    Json::Value json_in;
    Json::Reader reader;
    reader.parse(msg, json_in);
    std::cout << "Received message: " << json_in << std::endl;
    Json::Value json_out;
    json_out["response"] = "Hello from server!";
    con->send(json_out.toStyledString());
  }
  void handleNewConnection(const HttpRequestPtr &,
                           const WebSocketConnectionPtr &) override {}
  void handleConnectionClosed(const WebSocketConnectionPtr &) override {}
  WS_PATH_LIST_BEGIN
  WS_PATH_ADD("/api/v1/ws");
  WS_PATH_LIST_END
};