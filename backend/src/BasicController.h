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

  ADD_METHOD_TO(BasicController::Test, "/", Get, "CorsMiddleware");
  ADD_METHOD_TO(BasicController::RTCMakeOffer, "/api/v1/make-offer", Post,
                "CorsMiddleware");
  ADD_METHOD_TO(BasicController::AddIceCandidate, "/api/v1/add-ice-candidate",
                Post, "CorsMiddleware");

  ADD_METHOD_TO(BasicController::RTCGetAnswers, "/api/v1/rtc/answer", Get,
                "CorsMiddleware");

  ADD_METHOD_TO(BasicController::RTCAddAnswer, "/api/v1/rtc/answer", Post,
                "CorsMiddleware");
  ADD_METHOD_TO(BasicController::RTCGetAnswers, "/api/v1/rtc/offers", Get,
                "CorsMiddleware");

  ADD_METHOD_VIA_REGEX(BasicController::OptionsRequest, "/.*", Options,
                       "CorsMiddleware");
  METHOD_LIST_END

  void RTCGetAnswers(const HttpRequestPtr &req,
                     std::function<void(const HttpResponsePtr &)> &&callback) {
    auto c = connectToDb();

    pqxx::work tx{c};

    Json::Value json;
    json["answers"] = Json::arrayValue;

    for (auto [answer, channel_id] : tx.query<std::string, std::string>(
             "SELECT offer, channel_id FROM decencord_server.rtc_offers")) {
      Json::Value answer_json;
      answer_json["offer"] = answer;
      answer_json["channel_id"] = channel_id;
      json["answers"].append(answer_json);
    }

    tx.commit();

    auto resp = HttpResponse::newHttpJsonResponse(json);
    callback(resp);
  }

  void RTCAddAnswer(const HttpRequestPtr &req,
                    std::function<void(const HttpResponsePtr &)> &&callback) {
    auto c = connectToDb();

    pqxx::work tx{c};

    auto json_body = getJsonBody(req);

    if (!validateJsonBody(json_body,
                          {{"answer", Json::ValueType::objectValue},
                           {"channel_id", Json::ValueType::stringValue}})) {
      Json::Value json;
      json["success"] = false;
      json["message"] = "Invalid JSON body";

      auto resp = HttpResponse::newHttpJsonResponse(json);
      resp->setStatusCode(k400BadRequest);
      callback(resp);
      return;
    }

    c.prepare("ADD_ANSWER", "INSERT INTO decencord_server.rtc_answers (answer, "
                            "channel_id) VALUES ($1, $2)");

    auto r =
        tx.exec_prepared("ADD_ANSWER", json_body["answer"]["sdp"].asString(),
                         json_body["channel_id"].asString());

    tx.commit();

    Json::Value json;
    json["success"] = true;
    json["message"] = "Answer added";

    auto resp = HttpResponse::newHttpJsonResponse(json);
    callback(resp);
  }

  void
  AddIceCandidate(const HttpRequestPtr &req,
                  std::function<void(const HttpResponsePtr &)> &&callback) {
    auto c = connectToDb();

    pqxx::work tx{c};

    auto json_body = getJsonBody(req);

    if (!validateJsonBody(json_body,
                          {{"candidate", Json::ValueType::objectValue},
                           {"channel_id", Json::ValueType::stringValue}})) {
      Json::Value json;
      json["success"] = false;
      json["message"] = "Invalid JSON body";

      auto resp = HttpResponse::newHttpJsonResponse(json);
      resp->setStatusCode(k400BadRequest);
      callback(resp);
      return;
    }

    c.prepare("ADD_ICE_CANDIDATE",
              "INSERT INTO decencord_server.rtc_ice_candidates (candidate, "
              "channel_id) VALUES ($1, $2)");

    auto r = tx.exec_prepared("ADD_ICE_CANDIDATE",
                              json_body["candidate"]["candidate"].asString(),
                              json_body["channel_id"].asString());

    tx.commit();

    Json::Value json;
    json["success"] = true;
    json["message"] = "Ice candidate added";

    auto resp = HttpResponse::newHttpJsonResponse(json);
    callback(resp);
  }

  void RTCMakeOffer(const HttpRequestPtr &req,
                    std::function<void(const HttpResponsePtr &)> &&callback) {
    auto c = connectToDb();

    pqxx::work tx{c};

    auto json_body = getJsonBody(req);

    // channel_id string, offer {type: string, sdp: string}
    // TODO: this doesnt check nested json types
    if (!validateJsonBody(json_body,
                          {{"offer", Json::ValueType::objectValue},
                           {"channel_id", Json::ValueType::stringValue}})) {
      Json::Value json;
      json["success"] = false;
      json["message"] = "Invalid JSON body";

      auto resp = HttpResponse::newHttpJsonResponse(json);
      resp->setStatusCode(k400BadRequest);
      callback(resp);
      return;
    }

    c.prepare("ADD_OFFER", "INSERT INTO decencord_server.rtc_offers (offer, "
                           "channel_id) VALUES ($1, $2)");

    auto r = tx.exec_prepared("ADD_OFFER", json_body["offer"]["sdp"].asString(),
                              json_body["channel_id"].asString());

    tx.commit();

    Json::Value json;
    json["success"] = true;
    json["message"] = "Offer added";

    auto resp = HttpResponse::newHttpJsonResponse(json);
    callback(resp);
  }

  void OptionsRequest(const HttpRequestPtr &req,
                      std::function<void(const HttpResponsePtr &)> &&callback) {
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k200OK);
    // headers are set by CorsMiddleware
    std::cout << "OPTIONS request" << std::endl;
    callback(resp);
  }

  void Test(const HttpRequestPtr &req,
            std::function<void(const HttpResponsePtr &)> &&callback) {
    auto resp = HttpResponse::newHttpResponse();
    resp->setBody("TEST!");
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