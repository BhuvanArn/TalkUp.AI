/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** Implementation of the Router class
*/

#include <nlohmann/json.hpp>
#include <chrono>
#include <sstream>
#include <fstream>
#include <cstdlib>
#include <cctype>
#include <vector>

#include "WebsocketManager.hpp"
#include "ExceptionManager.hpp"
#include "Router.hpp"

void talkup_network::Router::get_env_key(void)
{
    const char* comm = std::getenv("COMMUNICATION");
    const char* ws = std::getenv("WS_ADDRESS");

    if (comm) __env_variables["COMMUNICATION"] = std::string(comm);
    if (ws) __env_variables["WS_ADDRESS"] = std::string(ws);
    if (!__env_variables["COMMUNICATION"].empty() && !__env_variables["WS_ADDRESS"].empty())
        return;

    std::ifstream env_file(".env");
    std::string line;

    if (!env_file.is_open())
        return;
    while (std::getline(env_file, line)) {
        size_t delim_pos = line.find('=');
        if (delim_pos == std::string::npos) {
            continue;
        }
        std::string key = line.substr(0, delim_pos);
        std::string value = line.substr(delim_pos + 1);
        key.erase(0, key.find_first_not_of(" \t\n\r"));
        key.erase(key.find_last_not_of(" \t\n\r") + 1);
        value.erase(0, value.find_first_not_of(" \t\n\r"));
        value.erase(value.find_last_not_of(" \t\n\r") + 1);
        __env_variables[key] = value;
    }
    env_file.close();
}

void talkup_network::Router::set_routes_definitions(crow::SimpleApp& app,
    std::shared_ptr<MicroservicesManager> microservices_manager)
{
    get_env_key();
    MicroservicesManager::initialize_ws_service_connections();
    CROW_ROUTE(app, "/")([](){
        return "Hello world";
    });
    CROW_ROUTE(app, "/process/initialization").methods("POST"_method)([&](const crow::request& req){
        try {
            static const std::string SERVER_KEY = __env_variables["COMMUNICATION"];
            static const std::string WS_ADDRESS = __env_variables["WS_ADDRESS"];

            if (req.body.empty()) {
                nlohmann::json err;
                err["type"] = "error";
                err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                err["data"] = { {"message", "empty request body"} };
                crow::response res(err.dump());
                res.set_header("Content-Type", "application/json");
                res.code = __ErrorCode::FAILURE;
                return res;
            }
            auto j = nlohmann::json::parse(req.body);
            if (!j.contains("key") || !j.contains("type") || !j.contains("format")) {
                nlohmann::json err;
                err["type"] = "error";
                err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                err["data"] = { {"message", "missing required fields: key/type/format"} };
                crow::response res(err.dump());
                res.set_header("Content-Type", "application/json");
                res.code = __ErrorCode::FAILURE;
                return res;
            }
            if (!SERVER_KEY.empty()) {
                try {
                    std::string provided = j["key"].get<std::string>();
                    if (provided != SERVER_KEY) {
                        nlohmann::json err;
                        err["type"] = "error";
                        err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count();
                        err["data"] = { {"message", "unauthorized: invalid key"} };
                        crow::response res(err.dump());
                        res.set_header("Content-Type", "application/json");
                        res.code = __ErrorCode::INV_KEY;
                        return res;
                    }
                } catch (...) {
                    nlohmann::json err;
                    err["type"] = "error";
                    err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count();
                    err["data"] = { {"message", "invalid key format"} };
                    crow::response res(err.dump());
                    res.set_header("Content-Type", "application/json");
                    res.code = __ErrorCode::FAILURE;
                    return res;
                }
            } else {
                nlohmann::json err;
                err["type"] = "error";
                err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                err["data"] = { {"message", "server key not set"} };
                crow::response res(err.dump());
                res.set_header("Content-Type", "application/json");
                res.code = __ErrorCode::KEY_NOT_SET;
                return res;
            }
            if (j["type"].get<std::string>() != "initialization") {
                nlohmann::json err;
                err["type"] = "error";
                err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                err["data"] = { {"message", "invalid type for this endpoint"} };
                crow::response res(err.dump());
                res.set_header("Content-Type", "application/json");
                res.code = __ErrorCode::FAILURE;
                return res;
            }
            nlohmann::json ok;
            ok["key"] = SERVER_KEY;
            ok["type"] = "initialization_response";
            ok["format"] = "text";
            ok["data"] = WS_ADDRESS;
            crow::response res(ok.dump());
            res.set_header("Content-Type", "application/json");
            res.code = __ErrorCode::SUCCESS;
            return res;
        } catch (const std::exception &e) {
            nlohmann::json err;
            err["type"] = "error";
            err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count();
            err["data"] = { {"message", std::string("invalid json: ") + e.what()} };
            crow::response res(err.dump());
            res.set_header("Content-Type", "application/json");
            res.code = __ErrorCode::FAILURE;
            return res;
        }
    });

    CROW_ROUTE(app, "/ws").websocket()
    .onopen([](crow::websocket::connection& conn){
        std::ostringstream oss;
        oss << "[WS] Connection opened: " << (void*)&conn;
        std::cout << oss.str() << std::endl;
    })
    .onclose([](crow::websocket::connection& conn, const std::string& reason){
        std::ostringstream oss;
        oss << "[WS] Connection closed: " << (void*)&conn << " reason: " << reason;
        std::cout << oss.str() << std::endl;
    })
    .onmessage([this, microservices_manager](crow::websocket::connection& conn,
        const std::string& data, bool is_binary){
        try {
            if (is_binary) {
                return;
            }
            auto j = nlohmann::json::parse(data);

            if (!j.contains("type") || !j.contains("stream_id") || !j.contains("format") ||
                !j.contains("timestamp") || !j.contains("data") || !j.contains("key") ) {
                    throw ExceptionManager::NetworkInvalidJsonException();
            }
            if (__env_variables["COMMUNICATION"] != j["key"].get<std::string>()) {
                nlohmann::json err;
                std::cout << "[Server] Invalid key received " << std::endl;
                throw ExceptionManager::NetworkInvalidKeyException();
            }
            _ws_manager.connection_type_manager(j, conn, microservices_manager);
        } catch (const std::exception &e) {
            nlohmann::json err;
            err["type"] = "error";
            err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count();
            err["data"] = { {"message", std::string("invalid json: ") + e.what()} };
            conn.send_text(err.dump());
        }
    });
}
