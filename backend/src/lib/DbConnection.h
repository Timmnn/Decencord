#pragma once
#include <pqxx/pqxx>

pqxx::connection connectToDb() {
  return pqxx::connection{
      "postgresql://postgres:postgres@postgres:5432/postgres"};
}