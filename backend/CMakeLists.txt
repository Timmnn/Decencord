cmake_minimum_required(VERSION 3.10)

# Set the toolchain file path before defining the project
# Replace the path with the actual path to your vcpkg toolchain file
# or use an environment variable
set(CMAKE_TOOLCHAIN_FILE $ENV{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake
    CACHE STRING "Vcpkg toolchain file")

project(MyProject VERSION 1.0 LANGUAGES CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED True)

find_package(Drogon CONFIG REQUIRED)

add_executable(${PROJECT_NAME} ../src/main.cpp)
set_target_properties(${PROJECT_NAME} PROPERTIES
  CXX_STANDARD 17
  CXX_STANDARD_REQUIRED YES
  CXX_EXTENSIONS NO
)

# Manually specify the include directory
target_include_directories(${PROJECT_NAME} PRIVATE /Users/timmn/vcpkg/packages/drogon_arm64-osx/include)

# Link against Drogon
target_link_libraries(${PROJECT_NAME} PRIVATE Drogon::Drogon)

target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra)