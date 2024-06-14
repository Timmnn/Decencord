#include <drogon/drogon.h>

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
          },
          {Get, "LoginFilter"})
      .run();
}
