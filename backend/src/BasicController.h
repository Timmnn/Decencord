#include <drogon/drogon.h>

#include <iostream>
#include <pqxx/pqxx>

#include "CorsMiddleware.h"
#include "iostream"
#include "lib/DbConnection.h"
#include "lib/JsonBodyHandling.h"

using namespace drogon;

class BasicController : public HttpController<BasicController, false> {
public:
  METHOD_LIST_BEGIN
  // cors options request to any path

  ADD_METHOD_TO(BasicController::GetMessages, "/api/v1/messages", Get, Options,
                "CorsMiddleware");
  ADD_METHOD_TO(BasicController::PostMessages, "/api/v1/messages", Post,
                "CorsMiddleware");

  ADD_METHOD_VIA_REGEX(BasicController::OptionsRequest, "/.*", Options,
                       "CorsMiddleware");

  METHOD_LIST_END

  void OptionsRequest(const HttpRequestPtr &req,
                      std::function<void(const HttpResponsePtr &)> &&callback) {
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k200OK);
    // headers are set by CorsMiddleware
    std::cout << "OPTIONS request" << std::endl;
    callback(resp);
  }

  void GetMessages(const HttpRequestPtr &req,
                   std::function<void(const HttpResponsePtr &)> &&callback) {
    // send hello world to client

    try {
      pqxx::connection c{
          "postgresql://postgres:postgres@postgres:5432/postgres"};

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
    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
    }
  }

  void PostMessages(const HttpRequestPtr &req,
                    std::function<void(const HttpResponsePtr &)> &&callback) {
    try {
      pqxx::connection c{
          "postgresql://postgres:postgres@postgres:5432/postgres"};

      pqxx::work tx{c};

      Json::Value json_body = getJsonBody(req);

      std::string content = json_body["content"].asString();

      // Execute the query with parameters and get the result
      pqxx::result r = tx.exec_params(
          "INSERT INTO decencord_server.messages (content, user_id, "
          "created_at) "
          "VALUES ($1, $2, now()) RETURNING user_id, created_at",
          content, "1");

      if (r.empty()) {
        tx.abort();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
        return;
      }

      const auto &row = r[0];
      std::string user_id = row["user_id"].as<std::string>();
      std::string created_at = row["created_at"].as<std::string>();

      // Use the extracted data
      Json::Value json;
      json["content"] = content;
      json["user_id"] = user_id;
      json["created_at"] = created_at;

      // Commit the transaction
      tx.commit();

      auto resp = HttpResponse::newHttpJsonResponse(json);

      callback(resp);

    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
    }
  };
};