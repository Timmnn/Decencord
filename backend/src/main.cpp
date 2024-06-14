#include <drogon/drogon.h>

#include <iostream>
#include <pqxx/pqxx>

#include "iostream"
using namespace drogon;
int main() {
  std::cout << "Hello, World!" << std::endl;

  app()
      .setLogPath("./")
      .setLogLevel(trantor::Logger::kWarn)
      .addListener("0.0.0.0", 8090)
      .setThreadNum(16)
      // Register the route
      .registerHandler(
          "/",
          [](const HttpRequestPtr &req,
             std::function<void(const HttpResponsePtr &)> &&callback) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setBody("Hello, World!");
            callback(resp);
          })
      .registerHandler(
          "/api/v1/messages",
          [](const HttpRequestPtr &req,
             std::function<void(const HttpResponsePtr &)> &&callback) {
            pqxx::connection c{
                "postgresql://postgres:postgres@localhost:5432/postgres"};
            pqxx::work tx{c};

            Json::Value json;
            json["messages"] = Json::arrayValue;

            for (auto [content, user_id, created_at] :
                 tx.query<std::string, std::string, std::string>(
                     "SELECT content, user_id, created_at FROM "
                     "decencord_server.messages")) {
              Json::Value message;
              message["content"] = content;
              message["user_id"] = user_id;
              message["created_at"] = created_at;
              json["messages"].append(message);
            }

            tx.commit();

            auto resp = HttpResponse::newHttpJsonResponse(json);
            callback(resp);
          })
      .run();
}

struct Message {
  std::string content;
  std::string user_id;
  std::string created_at;
};