#include <drogon/drogon.h>

#include <iostream>
#include <pqxx/pqxx>

#include "iostream"
using namespace drogon;

#include "AuthController.h"
#include "BasicController.h"
#include "WebsocketController.h"

int main() {
  std::cout << "Hello, World!" << std::endl;

  auto basicControllerPtr = std::make_shared<BasicController>();
  auto authControllerPtr = std::make_shared<AuthController>();
  auto websocketControllerPtr = std::make_shared<WebsocketController>();

  // from  configfile
  app()
      .registerController<BasicController>(basicControllerPtr)
      .registerController<AuthController>(authControllerPtr)
      .registerController<WebsocketController>(websocketControllerPtr)
      .loadConfigFile("../src/config.json")
      .run();
}

struct Message {
  std::string content;
  std::string user_id;
  std::string created_at;
};
