cmake_minimum_required(VERSION 3.14)
project(Talkup)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(BUILD_TESTING OFF CACHE BOOL "Disable tests")
set(CROW_BUILD_TESTS OFF CACHE BOOL "Disable Crow tests")
set(JSON_BuildTests OFF CACHE BOOL "Disable JSON tests")

include(FetchContent)

# Crow
FetchContent_Declare(
    crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG v1.0+1
)
FetchContent_MakeAvailable(crow)

# CPR
FetchContent_Declare(
    cpr
    GIT_REPOSITORY https://github.com/libcpr/cpr.git
    GIT_TAG 1.11.2
)
FetchContent_MakeAvailable(cpr)

# JSON
set(JSON_BuildTests OFF CACHE INTERNAL "")
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(json)

# Google Test
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG release-1.12.1
)
FetchContent_MakeAvailable(googletest)

set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

set(SOURCES
    src/Server.cpp
    src/Notifications.cpp
    src/ExceptionManager.cpp
    src/network/Router.cpp
    src/network/WebsocketManager.cpp
    src/network/MicroservicesManager.cpp
    src/network/WsClientSession.cpp
    main.cpp
)

set(SOURCES_TESTS
    src/Server.cpp
    src/Notifications.cpp
    src/ExceptionManager.cpp
    src/network/Router.cpp
    src/network/WebsocketManager.cpp
    src/network/MicroservicesManager.cpp
    src/network/WsClientSession.cpp
)

include_directories(${CMAKE_SOURCE_DIR}/inc)

add_executable(talkup_ai_mic_server ${SOURCES})
add_executable(tests tests/test_server_init.cpp ${SOURCES_TESTS})

file(GLOB_RECURSE HEADER_FILES "${CMAKE_SOURCE_DIR}/inc/*.hpp")

foreach(HEADER_FILE ${HEADER_FILES})
    get_filename_component(HEADER_DIR ${HEADER_FILE} DIRECTORY)
    list(APPEND INCLUDE_DIRS ${HEADER_DIR})
endforeach()
list(REMOVE_DUPLICATES INCLUDE_DIRS)

target_include_directories(talkup_ai_mic_server
    PRIVATE
      ${crow_SOURCE_DIR}/include
      ${INCLUDE_DIRS}
)

target_link_libraries(talkup_ai_mic_server
    PRIVATE
      cpr::cpr
      nlohmann_json::nlohmann_json
      pthread
)

# Tests setup
target_include_directories(tests
    PRIVATE
      ${crow_SOURCE_DIR}/include
      ${INCLUDE_DIRS}
)

target_link_libraries(tests
    PRIVATE
      cpr::cpr
      nlohmann_json::nlohmann_json
      pthread
)

target_link_libraries(tests
    PRIVATE
      GTest::gtest
      GTest::gmock
      GTest::gtest_main
      GTest::gmock_main
)
