#pragma once
#include <drogon/drogon.h>

#include <iostream>

using namespace drogon;

Json::Value getJsonBody(const HttpRequestPtr &req) {
  std::string body = std::string(req->getBody());
  Json::Value json_body;
  Json::Reader reader;

  bool parsingSuccessful =
      reader.parse(body, json_body); // Use Json::Reader to parse the string
  if (!parsingSuccessful) {
    // Handle parsing error
    std::cerr << "Failed to parse JSON" << std::endl;
    std::cerr << "Body: " << body << std::endl;
    return Json::Value();
  }
  return json_body;
}

// vector of {name, type}
bool validateJsonBody(const Json::Value &json_body,
                      const std::vector<std::pair<std::string, Json::ValueType>>
                          &required_fields) {
  // print keys
  std::cout << "Keys: ";
  for (auto const &key : json_body.getMemberNames()) {
    std::cout << key << " ";
  }
  for (auto [name, type] : required_fields) {
    if (!json_body.isMember(name) || json_body[name].type() != type) {
      std::cout << "Invalid JSON body" << std::endl;
      std::cout << "Missing field: " << name << std::endl;
      std::cout << "Expected type: " << type << std::endl;
      std::cout << "Actual type: " << json_body[name].type() << std::endl;
      return false;
    }
  }
  return true;
}