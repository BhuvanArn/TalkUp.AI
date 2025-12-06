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

// Will be refactored before pull request validation
void talkup_network::MicroservicesManager::send_to_stt_microservice(
    const nlohmann::json &data)
{
    try {
        nlohmann::json chunk_val;
        nlohmann::json ping_json = {
            {"services", {"STT"}},
            {"type", "ping"},
            {"timestamp", std::time(nullptr)},
            {"data", nlohmann::json::object()}
        };

        try {
            if (data.is_string()) {
                std::string s = data.get<std::string>();
                std::cout << "[MicroservicesManager] Incoming data is string, length=" << s.size() << "\n";
            } else if (data.is_object() && data.contains("data") && data["data"].is_string()) {
                std::string s = data["data"].get<std::string>();
                std::cout << "[MicroservicesManager] Incoming data.data is string, length=" << s.size() << "\n";
            } else if (data.is_object() && data.contains("chunk") && data["chunk"].is_string()) {
                std::string s = data["chunk"].get<std::string>();
                std::cout << "[MicroservicesManager] Incoming chunk is string, length=" << s.size() << "\n";
            } else {
                std::cout << "[MicroservicesManager] Incoming data shape: " << data.dump() << "\n";
            }
        } catch (const std::exception &e) {
            std::cerr << "[MicroservicesManager] Debug logging failed: " << e.what() << std::endl;
        }

        if (data.is_string()) {
            chunk_val = data.get<std::string>();
        } else if (data.is_object() && data.contains("chunk") && data["chunk"].is_string()) {
            chunk_val = data["chunk"];
        } else if (data.is_object() && data.contains("data") && data["data"].is_object() && data["data"].contains("chunk") && data["data"]["chunk"].is_string()) {
            chunk_val = data["data"]["chunk"];
        } else if (data.is_object() && data.contains("data") && data["data"].is_string()) {
            chunk_val = data["data"];
        } else {
            std::cerr << "[MicroservicesManager] Warning: unexpected `data` shape when sending to STT: " << data.dump() << std::endl;
            chunk_val = data.is_string() ? data.get<std::string>() : data.dump();
        }
        boost::asio::io_context ioc;
        boost::asio::ip::tcp::resolver resolver{ioc};
        boost::beast::websocket::stream<boost::beast::tcp_stream> ws{ioc};

        auto const results = resolver.resolve(__services_list["stt"]["Ip"], __services_list["stt"]["Port"]);
        boost::beast::get_lowest_layer(ws).connect(results);
        // Defensive check: ensure the underlying TCP socket is open after connect
        if (!boost::beast::get_lowest_layer(ws).socket().is_open()) {
            std::cout << "[MicroservicesManager] TCP socket not open after connect to STT" << std::endl;
            return;
        } else {
            std::cout << "[MicroservicesManager] TCP socket successfully opened with STT at "
                      << __services_list["stt"]["Ip"] << ":" << __services_list["stt"]["Port"] << std::endl;
        }

        std::cout << "RouteWS: " << __services_list["stt"]["RouteWs"] << std::endl;
        ws.handshake(__services_list["stt"]["Ip"], __services_list["stt"]["RouteWs"]);
        // Verify websocket is open after handshake
        if (!ws.is_open()) {
            std::cout << "[MicroservicesManager] WebSocket not open after handshake with STT" << std::endl;
            try { ws.close(boost::beast::websocket::close_code::normal); } catch(...) {}
            return;
        } else {
            std::cout << "[MicroservicesManager] WebSocket successfully opened with STT at "
                      << __services_list["stt"]["Ip"] << __services_list["stt"]["RouteWs"] << std::endl;
        }

        ws.write(boost::asio::buffer(ping_json.dump()));
        boost::beast::flat_buffer buffer;
        ws.read(buffer);
        // Ensure the connection remained open after read
        if (!ws.is_open()) {
            std::cout << "[MicroservicesManager] WebSocket closed unexpectedly after reading pong" << std::endl;
            return;
        }
        std::cout << "buffer contents: " << boost::beast::buffers_to_string(buffer.data()) << std::endl;
        std::string pong_msg = boost::beast::buffers_to_string(buffer.data());
        nlohmann::json pong_json = nlohmann::json::parse(pong_msg);
        if (pong_json["type"] != "pong") {
            throw std::runtime_error("STT microservice is not reachable.");
        }

        std::cout << "[MicroservicesManager] STT microservice is reachable." << std::endl; // Debug log - will be removed later

        nlohmann::json audio_json = {
            {"services", {"STT"}},
            {"type", "stream_chunk"},
            {"timestamp", std::time(nullptr)},
            {"data", {
                {"chunk", chunk_val},
                {"eof", true}
            }}
        };
        ws.write(boost::asio::buffer(audio_json.dump()));
        boost::beast::flat_buffer resp_buf;
        const int timeout_ms = 10000; // 10 seconds timeout
        int fd = boost::beast::get_lowest_layer(ws).socket().native_handle();
        struct pollfd pfd;
        pfd.fd = fd;
        pfd.events = POLLIN;
        pfd.revents = 0;

        int poll_ret = ::poll(&pfd, 1, timeout_ms);
        if (poll_ret > 0 && (pfd.revents & POLLIN)) {
            ws.read(resp_buf);
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
        ws.close(boost::beast::websocket::close_code::normal);
    } catch (const std::exception &e) {
        std::cerr << "[MicroservicesManager] Exception: " << e.what() << std::endl;
    }
}
