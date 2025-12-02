/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** Implementation of the WsManager class
*/

#include <nlohmann/json.hpp>
#include <chrono>
#include <sstream>

#include "ExceptionManager.hpp"
#include "WebsocketManager.hpp"

talkup_network::WsManager::WsManager()
{
    _type_handlers["ping"] = [this](const nlohmann::json& json,
        crow::websocket::connection& conn){ handle_ping(json,conn); };
    _type_handlers["stream_chunk"] = [this](const nlohmann::json& json,
        crow::websocket::connection& conn){ handle_stream_chunk(json,conn, nullptr); };
}

void talkup_network::WsManager::connection_type_manager(nlohmann::json &json, crow::websocket::connection &conn,
    std::shared_ptr<MicroservicesManager> microservices_manager)
{
    try {
        std::string type = json["type"].get<std::string>();

        auto it = _type_handlers.find(type);
        if (it != _type_handlers.end()) {
            it->second(json, conn);
        } else {
            nlohmann::json err;
            err["type"] = "error";
            err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count();
            err["data"] = { {"message", "unknown type: " + type} };
            conn.send_text(err.dump());
        }
    } catch (const std::exception &e) {
        nlohmann::json err;
        err["type"] = "error";
        err["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
        err["data"] = { {"message", e.what()} };
        conn.send_text(err.dump());
    }
}

void talkup_network::WsManager::handle_ping(const nlohmann::json& json, crow::websocket::connection& conn)
{
    nlohmann::json pong;

    pong["type"] = "pong";
    pong["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    if (json.contains("key")) pong["key"] = json["key"];
    if (json.contains("data")) pong["data"] = json["data"];
    conn.send_text(pong.dump());
}

void talkup_network::WsManager::handle_stream_chunk(const nlohmann::json& json, crow::websocket::connection& conn,
    std::shared_ptr<MicroservicesManager> microservices_manager)
{
    if (json["format"] == "audio") {
        conn.send_text(set_respond_json_format({
            .type = "acknowledge",
            .key = json["key"].get<std::string>(),
            .stream_id = json["stream_id"].get<std::string>(),
            .format = json["format"].get<std::string>(),
            .timestamp = json["timestamp"].get<int64_t>(),
            .data = "audio chunk received"
        }).dump());
        microservices_manager->send_to_stt_microservice(json);
    }
}

nlohmann::json talkup_network::WsManager::set_respond_json_format(const WebSocketConnectionInfo& info) const
{
    nlohmann::json json;

    json["type"] = info.type;
    json["key"] = info.key;
    json["stream_id"] = info.stream_id;
    json["format"] = info.format;
    json["timestamp"] = info.timestamp;
    json["data"] = info.data;
    return json;
}
