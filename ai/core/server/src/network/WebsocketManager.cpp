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

#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/ip/tcp.hpp>

using tcp = boost::asio::ip::tcp;
namespace http = boost::beast::http;

talkup_network::WsManager::WsManager()
{
    _type_handlers["ping"] = [this](const nlohmann::json& json,
        crow::websocket::connection& conn, std::shared_ptr<MicroservicesManager>) {
            handle_ping(json, conn);
        };
    _type_handlers["stream_chunk"] = [this](const nlohmann::json& json,
        crow::websocket::connection& conn, std::shared_ptr<MicroservicesManager> microservices_manager) {
            handle_stream_chunk(json, conn, microservices_manager);
        };
    _type_handlers["simulation_context"] = [this](const nlohmann::json& json,
        crow::websocket::connection& conn, std::shared_ptr<MicroservicesManager> microservices_manager) {
            handle_simulation_context(json, conn, microservices_manager);
        };
    _type_handlers["session_end"] = [this](const nlohmann::json& json,
        crow::websocket::connection& conn, std::shared_ptr<MicroservicesManager> microservices_manager) {
            handle_session_end(json, conn, microservices_manager);
        };
}

void talkup_network::WsManager::connection_type_manager(nlohmann::json &json, crow::websocket::connection &conn,
    std::shared_ptr<MicroservicesManager> microservices_manager)
{
    try {
        std::string type = json["type"].get<std::string>();
        auto it = _type_handlers.find(type);

        if (it != _type_handlers.end()) {
            it->second(json, conn, microservices_manager);
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
    std::string key = json["key"].get<std::string>();
    std::string stream_id = json["stream_id"].get<std::string>();
    std::string format = json["format"].get<std::string>();
    int64_t timestamp = json["timestamp"].get<int64_t>();

    if (json["format"] == "audio") {
        if (!microservices_manager) {
            conn.send_text(set_respond_json_format({
                .type = "error",
                .key = json.value("key", ""),
                .stream_id = json.value("stream_id", ""),
                .format = "text",
                .timestamp = std::chrono::duration_cast<std::chrono::seconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count(),
                .data = "microservices manager unavailable"
            }).dump());
            return;
        }

        std::string key = json["key"].get<std::string>();
        std::string stream_id = json["stream_id"].get<std::string>();
        std::string format = json["format"].get<std::string>();
        int64_t timestamp = json["timestamp"].get<int64_t>();

        conn.send_text(set_respond_json_format({
            .type = "acknowledge",
            .key = key,
            .stream_id = stream_id,
            .format = format,
            .timestamp = timestamp,
            .data = "audio chunk received"
        }).dump());
        crow::websocket::connection *client_conn = &conn;
        microservices_manager->send_to_sts_microservice(json,
            [this, client_conn, key, stream_id](const nlohmann::json& sts_resp) {
                // This callback may run asynchronously (deferred VA follow-up),
                // long after the client disconnected. Never touch the captured
                // raw connection pointer once it is no longer live, or we would
                // send_text on a freed connection.
                if (!talkup_network::is_connection_alive(client_conn)) {
                    std::cerr << "[WsManager] Dropping STS/VA response for closed connection"
                              << std::endl;
                    return;
                }

                const std::string sts_type = sts_resp.value("type", "");
                if (sts_resp.contains("error") || sts_type == "error" || sts_type == "warning") {
                    client_conn->send_text(set_respond_json_format({
                        .type = "error",
                        .key = key,
                        .stream_id = stream_id,
                        .format = "text",
                        .timestamp = std::chrono::duration_cast<std::chrono::seconds>(
                            std::chrono::system_clock::now().time_since_epoch()).count(),
                        .data = sts_resp.dump()
                    }).dump());
                    return;
                }

                if (sts_type == "va_result") {
                    nlohmann::json data_field = sts_resp.contains("data") ? sts_resp["data"] : sts_resp;
                    std::string data_str;
                    if (data_field.is_string())
                        data_str = data_field.get<std::string>();
                    else
                        data_str = data_field.dump();

                    client_conn->send_text(set_respond_json_format({
                        .type = "va_result",
                        .key = key,
                        .stream_id = stream_id,
                        .format = "text",
                        .timestamp = std::chrono::duration_cast<std::chrono::seconds>(
                            std::chrono::system_clock::now().time_since_epoch()).count(),
                        .data = data_str
                    }).dump());
                    return;
                }

                client_conn->send_text(set_respond_json_format({
                    .type = "sts_result",
                    .key = key,
                    .stream_id = stream_id,
                    .format = "audio",
                    .timestamp = std::chrono::duration_cast<std::chrono::seconds>(
                        std::chrono::system_clock::now().time_since_epoch()).count(),
                    .data = sts_resp.dump()
                }).dump());

                try {
                    std::string transcription;
                    if (sts_resp.is_string()) {
                        transcription = sts_resp.get<std::string>();
                    } else if (sts_resp.contains("transcription") && sts_resp["transcription"].is_string()) {
                        transcription = sts_resp["transcription"].get<std::string>();
                    } else if (sts_resp.contains("text") && sts_resp["text"].is_string()) {
                        transcription = sts_resp["text"].get<std::string>();
                    } else if (sts_resp.contains("data") && sts_resp["data"].is_object() && sts_resp["data"].contains("text") && sts_resp["data"]["text"].is_string()) {
                        transcription = sts_resp["data"]["text"].get<std::string>();
                    }

                    if (!transcription.empty()) {
                        const char *backend_env = std::getenv("BACKEND_URL");
                        if (backend_env && backend_env[0] != '\0') {
                            std::string backend_base = std::string(backend_env);
                            std::string target = "/ai/interviews/" + stream_id + "/transcripts";
                            if (!backend_base.empty() && backend_base.back() == '/') backend_base.pop_back();
                            std::string full_url = backend_base + target;

                            nlohmann::json body;
                            body["transcripts"] = nlohmann::json::array();
                            body["transcripts"].push_back({{"content", transcription}, {"who_stated", "user"}});

                            try {
                                std::string u = full_url;
                                const std::string http_prefix = "http://";
                                if (u.rfind(http_prefix, 0) != 0) {
                                    std::cerr << "[WsManager] Unsupported BACKEND_URL (only http://): " << full_url << std::endl;
                                } else {
                                    u.erase(0, http_prefix.size());
                                    auto pos = u.find('/');
                                    std::string hostport = (pos == std::string::npos) ? u : u.substr(0, pos);
                                    std::string target_path = (pos == std::string::npos) ? "/" : u.substr(pos);

                                    std::string host = hostport;
                                    std::string port = "80";
                                    auto colon = hostport.find(':');
                                    if (colon != std::string::npos) {
                                        host = hostport.substr(0, colon);
                                        port = hostport.substr(colon + 1);
                                    }

                                    boost::asio::io_context ioc;
                                    tcp::resolver resolver{ioc};
                                    boost::beast::tcp_stream stream{ioc};
                                    auto const results = resolver.resolve(host, port);
                                    stream.connect(results);

                                    http::request<http::string_body> req{http::verb::post, target_path, 11};
                                    req.set(http::field::host, host);
                                    req.set(http::field::user_agent, BOOST_BEAST_VERSION_STRING);
                                    req.set(http::field::content_type, "application/json");
                                    req.body() = body.dump();
                                    req.prepare_payload();

                                    http::write(stream, req);

                                    boost::beast::flat_buffer buffer;
                                    http::response<http::string_body> res;
                                    http::read(stream, buffer, res);
                                    std::cout << "[WsManager] Posted transcript to backend " << full_url << " status=" << res.result_int() << std::endl;

                                    boost::system::error_code ec;
                                    stream.socket().shutdown(tcp::socket::shutdown_both, ec);
                                }
                            } catch (const std::exception &e) {
                                std::cerr << "[WsManager] Failed to POST transcript: " << e.what() << std::endl;
                            }
                        } else {
                            std::cout << "[WsManager] BACKEND_URL not set; skipping transcript forward." << std::endl;
                        }
                    }
                } catch (const std::exception &e) {
                    std::cerr << "[WsManager] Error extracting transcription: " << e.what() << std::endl;
                }
            }
        );
    }
}

void talkup_network::WsManager::handle_simulation_context(const nlohmann::json& json,
    crow::websocket::connection& conn, std::shared_ptr<MicroservicesManager> microservices_manager)
{
    const std::string stream_id = json.value("stream_id", "");
    const std::string key = json.value("key", "");
    const int64_t timestamp = json.value("timestamp", static_cast<int64_t>(
        std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count()));

    if (stream_id.empty()) {
        conn.send_text(set_respond_json_format({
            .type = "error",
            .key = key,
            .stream_id = "",
            .format = "text",
            .timestamp = timestamp,
            .data = "simulation_context requires stream_id"
        }).dump());
        return;
    }

    if (!json.contains("data") || !json["data"].is_object()) {
        conn.send_text(set_respond_json_format({
            .type = "error",
            .key = key,
            .stream_id = stream_id,
            .format = "text",
            .timestamp = timestamp,
            .data = "simulation_context requires data object"
        }).dump());
        return;
    }

    if (!microservices_manager) {
        conn.send_text(set_respond_json_format({
            .type = "error",
            .key = key,
            .stream_id = stream_id,
            .format = "text",
            .timestamp = timestamp,
            .data = "microservices manager unavailable"
        }).dump());
        return;
    }

    const bool ok = MicroservicesManager::send_simulation_context_to_sts(
        stream_id, json["data"]);

    if (!ok) {
        conn.send_text(set_respond_json_format({
            .type = "error",
            .key = key,
            .stream_id = stream_id,
            .format = "text",
            .timestamp = timestamp,
            .data = "failed to register simulation context on STS"
        }).dump());
        return;
    }

    conn.send_text(set_respond_json_format({
        .type = "simulation_context_ack",
        .key = key,
        .stream_id = stream_id,
        .format = "text",
        .timestamp = timestamp,
        .data = "simulation context registered"
    }).dump());
}

void talkup_network::WsManager::handle_session_end(const nlohmann::json& json,
    crow::websocket::connection& conn, std::shared_ptr<MicroservicesManager> microservices_manager)
{
    const std::string key = json.value("key", "");
    const int64_t timestamp = json.value("timestamp", static_cast<int64_t>(
        std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count()));

    std::string interview_id = json.value("stream_id", "");
    if (json.contains("interview_id") && json["interview_id"].is_string())
        interview_id = json["interview_id"].get<std::string>();

    if (interview_id.empty()) {
        conn.send_text(set_respond_json_format({
            .type = "error",
            .key = key,
            .stream_id = "",
            .format = "text",
            .timestamp = timestamp,
            .data = "session_end requires stream_id or interview_id"
        }).dump());
        return;
    }

    if (microservices_manager)
        microservices_manager->send_session_end_to_sts(interview_id);

    conn.send_text(set_respond_json_format({
        .type = "session_end_ack",
        .key = key,
        .stream_id = interview_id,
        .format = "text",
        .timestamp = timestamp,
        .data = "session ended"
    }).dump());
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
