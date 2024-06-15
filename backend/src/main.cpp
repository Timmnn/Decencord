#include <drogon/drogon.h>

#include <iostream>
#include <pqxx/pqxx>

#include "iostream"
using namespace drogon;

#include "BasicController.h"

int main() {
  std::cout << "Hello, World!" << std::endl;

  auto ctrlPtr = std::make_shared<BasicController>();

  // from  configfile
  app()
      .registerController<BasicController>(ctrlPtr)
      .loadConfigFile("../src/config.json")
      .run();
}

struct Message {
  std::string content;
  std::string user_id;
  std::string created_at;
};