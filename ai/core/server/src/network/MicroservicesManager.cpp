/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** Implementation of the MicroservicesManager class
*/

#include "MicroservicesManager.hpp"

void talkup_network::MicroservicesManager::load_microservices_info(
    const std::string &file_path)
{
    try
    {
        std::ifstream file(file_path);
        nlohmann::json info;

        if (!file.is_open())
            throw std::ios_base::failure("Failed to open file: " + file_path);
        file >> info;
        for (auto &[k, lv] : info.items()) {
            for (auto &[lvk, value] : lv.items())
                __services_list[k][lvk] = value;
        }
        file.close();
    }
    catch(const std::exception& e)
    {
        std::cerr << e.what() << std::endl;
    }
}

const std::unordered_map<std::string, std::unordered_map<std::string, std::string>>&
    talkup_network::MicroservicesManager::get_services_list()
{
    return __services_list;
}

void talkup_network::MicroservicesManager::initialize_ws_service_connections()
{
    std::lock_guard<std::mutex> lock(__ws_mutex);

    for (const auto& [service_name, service_info] : __services_list) {
        try {
            std::cout << "[Server] Initializing connection to " << service_name << "..." << std::endl;

            auto& conn = __ws_connections[service_name];
            conn.io_context = std::make_shared<boost::asio::io_context>();
            conn.ws = std::make_shared<boost::beast::websocket::stream<boost::beast::tcp_stream>>(*conn.io_context);

            boost::asio::ip::tcp::resolver resolver{*conn.io_context};
            auto const results = resolver.resolve(service_info.at("Ip"), service_info.at("Port"));
            boost::beast::get_lowest_layer(*conn.ws).connect(results);

            if (!boost::beast::get_lowest_layer(*conn.ws).socket().is_open()) {
                std::cerr << "[Server] Failed to open TCP socket for " << service_name << std::endl;
                continue;
            }
            conn.ws->handshake(service_info.at("Ip"), service_info.at("RouteWs"));
            if (!conn.ws->is_open()) {
                std::cerr << "[Server] WebSocket handshake failed for " << service_name << std::endl;
                continue;
            }
            conn.is_connected = true;
            conn.io_thread = std::thread([io_ctx = conn.io_context]() {
                io_ctx->run();
            });
            std::cout << "[Server] Successfully connected to " << service_name
                << " at " << service_info.at("Ip") << ":" << service_info.at("Port")
                << service_info.at("RouteWs") << std::endl;

        } catch (const std::exception& e) {
            std::cerr << "[Server] Failed to initialize connection to "
                      << service_name << ": " << e.what() << std::endl;
        }
    }
}

nlohmann::json talkup_network::MicroservicesManager::get_chunks_val_from_data(
    const nlohmann::json &data)
{
    nlohmann::json chunk_val;

    if (data.is_string()) {
        chunk_val = data.get<std::string>();
    } else if (data.is_object() && data.contains("chunk") && data["chunk"].is_string()) {
        chunk_val = data["chunk"];
    } else if (data.is_object() && data.contains("data") && data["data"].is_object() &&
        data["data"].contains("chunk") && data["data"]["chunk"].is_string()) {
            chunk_val = data["data"]["chunk"];
    } else if (data.is_object() && data.contains("data") && data["data"].is_string()) {
        chunk_val = data["data"];
    } else {
        std::cerr << "[MicroservicesManager] Warning: unexpected `data` shape when extracting chunks: " << data.dump() << std::endl;
        chunk_val = data.is_string() ? data.get<std::string>() : data.dump();
    }
    return chunk_val;
}

bool talkup_network::MicroservicesManager::ping_service(
    const std::string &service_name)
{
    std::string service_id = service_name;
    std::transform(service_id.begin(), service_id.end(), service_id.begin(), ::toupper);
    std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
    {
        std::lock_guard<std::mutex> lock(__ws_mutex);
        auto it = __ws_connections.find(service_name);

        if (it == __ws_connections.end() || !it->second.is_connected) {
            std::cerr << "[MicroservicesManager] Service " << service_name << " connection not available" << std::endl;
            return false;
        }
        if (!it->second.ws || !it->second.ws->is_open()) {
            std::cerr << "[MicroservicesManager] Service " << service_name << " WebSocket connection is closed" << std::endl;
            it->second.is_connected = false;
            return false;
        }
        ws = it->second.ws;
    }

    try {
        nlohmann::json ping_json = {{"services", {service_id}}, {"type", "ping"}, {"timestamp", std::time(nullptr)},
            {"data", nlohmann::json::object()}};
        ws->write(boost::asio::buffer(ping_json.dump()));
        boost::beast::flat_buffer buffer;
        ws->read(buffer);
        std::string pong_msg = boost::beast::buffers_to_string(buffer.data());
        nlohmann::json pong_json = nlohmann::json::parse(pong_msg);

        if (pong_json["type"] != "pong") {
            std::cerr << "[MicroservicesManager] Service " << service_name << " did not respond with pong" << std::endl;
            return false;
        }
        std::cout << "[MicroservicesManager] Service " << service_name << " is reachable." << std::endl;
        return true;
    } catch (const std::exception &e) {
        std::cerr << "[MicroservicesManager] Exception while pinging service "
                  << service_name << ": " << e.what() << std::endl;
        return false;
    }
}

void talkup_network::MicroservicesManager::send_to_stt_microservice(
    const nlohmann::json &data)
{
    std::thread([data]() {
        try {
            nlohmann::json chunk_val = get_chunks_val_from_data(data);
            std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
            {
                std::lock_guard<std::mutex> lock(__ws_mutex);
                auto it = __ws_connections.find("stt");
                if (it == __ws_connections.end() || !it->second.is_connected) {
                    std::cerr << "[MicroservicesManager] STT connection not available" << std::endl;
                    return;
                }
                if (!it->second.ws || !it->second.ws->is_open()) {
                    std::cerr << "[MicroservicesManager] STT WebSocket connection is closed" << std::endl;
                    it->second.is_connected = false;
                    return;
                }
                ws = it->second.ws;
            }

            if (!ping_service("stt"))
                return;
            if (!ws || !ws->is_open()) {
                std::cerr << "[MicroservicesManager] STT WebSocket connection lost after ping" << std::endl;
                return;
            }

            nlohmann::json audio_json = {{"services", {"STT"}}, {"type", "stream_chunk"}, {"timestamp", std::time(nullptr)},
                {"data", {{"chunk", chunk_val}, {"eof", true}}}};
            ws->write(boost::asio::buffer(audio_json.dump()));
            boost::beast::flat_buffer resp_buf;
            const int timeout_ms = 10000;
            int fd = boost::beast::get_lowest_layer(*ws).socket().native_handle();
            struct pollfd pfd;
            pfd.fd = fd;
            pfd.events = POLLIN;
            pfd.revents = 0;

            int poll_ret = ::poll(&pfd, 1, timeout_ms);
            if (poll_ret > 0 && (pfd.revents & POLLIN)) {
                ws->read(resp_buf);
                std::string resp_msg = boost::beast::buffers_to_string(resp_buf.data());
                try {
                    nlohmann::json resp_json = nlohmann::json::parse(resp_msg);
                    std::cout << "[MicroservicesManager] Received response: " << resp_json.dump() << std::endl;
                } catch (const std::exception &e) {
                    std::cerr << "[MicroservicesManager] Failed to parse response as JSON: " << e.what() << " ; raw=" << resp_msg << std::endl;
                }
            } else if (poll_ret == 0) {
                std::cerr << "[MicroservicesManager] Read timed out after " << timeout_ms << " ms" << std::endl;
            } else {
                std::cerr << "[MicroservicesManager] poll() error: " << std::strerror(errno) << std::endl;
            }
        } catch (const std::exception &e) {
            std::cerr << "[MicroservicesManager] Exception: " << e.what() << std::endl;
        }
    }).detach();
}
