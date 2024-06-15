#include <drogon/drogon.h>
using namespace drogon;

class CorsMiddleware : public HttpMiddleware<CorsMiddleware> {
 public:
  CorsMiddleware(){};  // do not omit constructor

  void invoke(const HttpRequestPtr &req, MiddlewareNextCallback &&nextCb,
              MiddlewareCallback &&mcb) override {
    std::cout << "CorsMiddleware" << std::endl;
    nextCb([mcb = std::move(mcb)](const HttpResponsePtr &resp) {
      resp->addHeader("Access-Control-Allow-Origin", "*");
      resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
      resp->addHeader("Access-Control-Max-Age", "86400");
      mcb(resp);
    });
  }
};
