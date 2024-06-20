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

  ADD_METHOD_TO(BasicController::PostLogin, "/api/v1/login", Post,
                "CorsMiddleware");

  ADD_METHOD_TO(BasicController::GetUser, "/api/v1/user", Get,
                "CorsMiddleware");

  ADD_METHOD_TO(BasicController::GetUsers, "/api/v1/users", Get,
                "CorsMiddleware");

  ADD_METHOD_TO(BasicController::GetChannels, "/api/v1/channels", Get,
                "CorsMiddleware");

  ADD_METHOD_VIA_REGEX(BasicController::OptionsAnyRoute, "/.*", Options,
                       "CorsMiddleware");

  METHOD_LIST_END

  void GetChannels(const HttpRequestPtr &req,
                   std::function<void(const HttpResponsePtr &)> &&callback) {
    try {
      auto c = connectToDb();
      pqxx::work tx{c};

      // Execute the query with parameters and get the result
      pqxx::result r = tx.exec("SELECT * FROM decencord_server.channels");

      // Use the extracted data
      Json::Value json;
      json["channels"] = Json::arrayValue;

      for (const auto &row : r) {
        Json::Value channel;
        channel["id"] = row["id"].as<std::string>();
        channel["name"] = row["name"].as<std::string>();
        channel["type"] = row["type"].as<std::string>();
        json["channels"].append(channel);
      }

      // Commit the transaction
      tx.commit();

      auto resp = HttpResponse::newHttpJsonResponse(json);

      callback(resp);

    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
    }
  };

  void
  OptionsAnyRoute(const HttpRequestPtr &req,
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

      std::string channel_id = req->getParameter("channel_id");

      for (const auto &row :
           tx.exec_params("SELECT content, user_id, created_at FROM "
                          "decencord_server.messages WHERE channel_id = $1",
                          channel_id)) {
        Json::Value message;
        message["content"] = row["content"].as<std::string>();
        message["user_id"] = row["user_id"].as<std::string>();
        message["created_at"] = row["created_at"].as<std::string>();
        json["messages"].append(message);
      }

      tx.commit();

      auto resp = HttpResponse::newHttpJsonResponse(json);
      callback(resp);
    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
      auto resp = HttpResponse::newHttpResponse();
      resp->setStatusCode(k500InternalServerError);
      callback(resp);
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

  void PostLogin(const HttpRequestPtr &req,
                 std::function<void(const HttpResponsePtr &)> &&callback) {
    try {
      auto c = connectToDb();
      pqxx::work tx{c};

      Json::Value json_body = getJsonBody(req);

      std::string username = json_body["username"].asString();
      std::string password = json_body["password"].asString();

      std::string session_id = req->session()->sessionId();

      std::cout << "session_id: " << session_id << std::endl;

      // check for existing session
      pqxx::result r0 = tx.exec_params(
          "SELECT user_id FROM decencord_server.sessions WHERE id = $1",
          session_id);

      std::cout << "DBG" << std::endl;
      // print the result

      std::cout << "Found " << r0.size() << " rows:" << std::endl;

      if (!r0.empty()) {
        const auto &row = r0[0];
        std::string user_id = row["user_id"].as<std::string>();

        Json::Value json;
        json["user_id"] = user_id;

        auto resp = HttpResponse::newHttpJsonResponse(json);
        callback(resp);
        return;
      }

      std::cout << "AAA" << std::endl;

      // Execute the query with parameters and get the result
      pqxx::result r = tx.exec_params(
          "SELECT id FROM decencord_server.users WHERE username = $1 AND "
          "password = $2",
          username, password);

      std::cout << "BBB " << r.size() << " rows:" << std::endl;

      if (r.empty()) {
        tx.abort();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        callback(resp);
        return;
      }

      const auto &row = r[0];
      std::string user_id = row["id"].as<std::string>();

      // Use the extracted data
      Json::Value json;
      json["user_id"] = user_id;

      // create a session
      pqxx::result r1 = tx.exec_params(
          "INSERT INTO decencord_server.sessions (user_id, created_at, id) "
          "VALUES ($1, now(), $2)",
          user_id, session_id);

      // Commit the transaction
      tx.commit();

      auto resp = HttpResponse::newHttpJsonResponse(json);

      callback(resp);

    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
    }
  };

  void GetUser(const HttpRequestPtr &req,
               std::function<void(const HttpResponsePtr &)> &&callback) {
    try {
      auto c = connectToDb();
      pqxx::work tx{c};

      std::string session_id = req->session()->sessionId();

      // check for existing session
      pqxx::result r0 = tx.exec_params(
          "SELECT user_id FROM decencord_server.sessions WHERE id = $1",
          session_id);

      if (r0.empty()) {
        tx.abort();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        callback(resp);
        return;
      }

      const auto &row = r0[0];
      std::string user_id = row["user_id"].as<std::string>();

      // Execute the query with parameters and get the result
      pqxx::result r = tx.exec_params(
          "SELECT username FROM decencord_server.users WHERE id = $1", user_id);

      if (r.empty()) {
        tx.abort();
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
        return;
      }

      const auto &row1 = r[0];
      std::string username = row1["username"].as<std::string>();

      // Use the extracted data
      Json::Value json;
      json["user_id"] = user_id;
      json["username"] = username;

      // Commit the transaction
      tx.commit();

      auto resp = HttpResponse::newHttpJsonResponse(json);

      callback(resp);

    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
    }
  };

  void GetUsers(const HttpRequestPtr &req,
                std::function<void(const HttpResponsePtr &)> &&callback) {
    try {
      auto c = connectToDb();
      pqxx::work tx{c};

      // Execute the query with parameters and get the result
      pqxx::result r =
          tx.exec("SELECT id, username FROM decencord_server.users");

      // Use the extracted data
      Json::Value json;
      json["users"] = Json::arrayValue;

      for (const auto &row : r) {
        Json::Value user;
        user["id"] = row["id"].as<std::string>();
        user["username"] = row["username"].as<std::string>();
        json["users"].append(user);
      }

      // Commit the transaction
      tx.commit();

      auto resp = HttpResponse::newHttpJsonResponse(json);

      callback(resp);

    } catch (const std::exception &e) {
      std::cerr << e.what() << std::endl;
    }
  };
};