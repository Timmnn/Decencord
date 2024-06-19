#include "drogon/HttpController.h"
#include "pqxx/pqxx"

struct User {
  std::string id;
  std::string username;
};

User getUserFromSession(std::string session_id) {
  auto c = connectToDb();
  pqxx::work tx{c};

  // check for existing session
  pqxx::result r0 = tx.exec_params(
      "SELECT user_id FROM decencord_server.sessions WHERE id = $1",
      session_id);

  if (r0.empty()) {
    tx.abort();
    return {"", ""};
  }

  const auto &row = r0[0];
  std::string user_id = row["user_id"].as<std::string>();

  // Execute the query with parameters and get the result
  pqxx::result r = tx.exec_params(
      "SELECT username FROM decencord_server.users WHERE id = $1", user_id);

  if (r.empty()) {
    tx.abort();
    throw std::runtime_error("Internal Server Error");
  }

  const auto &row1 = r[0];
  std::string username = row1["username"].as<std::string>();

  // Commit the transaction
  tx.commit();

  return {user_id, username};
}