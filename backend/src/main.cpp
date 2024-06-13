#include <drogon/drogon.h>
using namespace drogon;
int main() {
  app()
      .setLogPath("./")
      .setLogLevel(trantor::Logger::kWarn)
      .addListener("0.0.0.0", 8090)
      .setThreadNum(16)
      // Register the route
      .registerHandler(
          "/test?username={name}",
          [](const HttpRequestPtr &req,
             std::function<void(const HttpResponsePtr &)> &&callback,
             const std::string &name) {
            Json::Value json;
            json["result"] = "ok";
            json["message"] = std::string("hello,") + name;
            auto resp = HttpResponse::newHttpJsonResponse(json);
            callback(resp);
          },
          {Get, "LoginFilter"})
      .run();
}
