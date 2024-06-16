#include <drogon/drogon.h>

#include <iostream>
#include <pqxx/pqxx>

#include "iostream"
#include "lib/DbConnection.h"
#include "lib/JsonBodyHandling.h"
using namespace drogon;

class AuthController : public HttpController<AuthController, false> {
public:
  METHOD_LIST_BEGIN
  ADD_METHOD_TO(AuthController::NewSession, "/api/v1/login", Post);
  METHOD_LIST_END

  void NewSession(const HttpRequestPtr &req,
                  std::function<void(const HttpResponsePtr &)> &&callback) {
    auto json_body = getJsonBody(req);

    if (!validateJsonBody(json_body,
                          {{"username", Json::ValueType::stringValue},
                           {"password", Json::ValueType::stringValue}})) {
      Json::Value json;
      json["success"] = false;
      json["message"] = "Invalid JSON body";

      auto resp = HttpResponse::newHttpJsonResponse(json);
      resp->setStatusCode(k400BadRequest);
      callback(resp);
      return;
    }

    std::string username = json_body["username"].asString();
    std::string password = json_body["password"].asString();

    auto c = connectToDb();

    pqxx::work tx{c};

    // TODO: Storing passwords is insecure, use hashing + salting + pepper
    c.prepare("CHECK_CREDENTIALS",
              "SELECT id FROM decencord_server.users WHERE username = "
              "$1 AND password = $2 LIMIT 1");

    auto r = tx.exec_prepared("CHECK_CREDENTIALS", username, password);

    // TODO: this way of checking if a user exists is not ideal. Something like
    // "if(r.empty())" would be better
    bool user_exists = false;
    int user_id;

    for (const auto &row : r) {
      user_exists = true;
      user_id = row[0].as<int>();
    }

    if (!user_exists) {
      Json::Value json;
      json["success"] = false;
      json["message"] = "Invalid username or password";

      auto resp = HttpResponse::newHttpJsonResponse(json);
      resp->setStatusCode(k401Unauthorized);
      callback(resp);
      return;
    }

    std::string session_id = req->getSession()->sessionId();

    // store session in database
    c.prepare("CREATE_SESSION",
              "INSERT INTO decencord_server.sessions (user_id, id) "
              "VALUES ($1, $2)");

    tx.exec_prepared("CREATE_SESSION", user_id, session_id);

    tx.commit();

    Json::Value json;
    json["success"] = true;
    json["message"] = "Successfully logged in";

    auto resp = HttpResponse::newHttpJsonResponse(json);
    callback(resp);
  };
};