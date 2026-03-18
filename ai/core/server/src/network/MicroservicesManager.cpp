/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** Implementation of the MicroservicesManager class
*/

#include "MicroservicesManager.hpp"

namespace {
    nlohmann::json extract_text_from_stt_response(const nlohmann::json &data)
    {
        if (data.is_string()) {
            return data.get<std::string>();
        }

        if (data.is_object() && data.contains("text") && data["text"].is_string()) {
            return data["text"];
        }

        if (data.is_object() && data.contains("data") && data["data"].is_object() &&
            data["data"].contains("text") && data["data"]["text"].is_string()) {
            return data["data"]["text"];
        }

        if (data.is_object() && data.contains("data") && data["data"].is_string()) {
            return data["data"];
        }

        return "";
    }
}

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

bool talkup_network::MicroservicesManager::connect_to_service(
    const std::string &service_name,
    const std::unordered_map<std::string, std::string> &service_info)
{
    std::cout << "[Server] Initializing connection to " << service_name << "..." << std::endl;

    auto& conn = __ws_connections[service_name];
    conn.io_context = std::make_shared<boost::asio::io_context>();
    conn.ws = std::make_shared<boost::beast::websocket::stream<boost::beast::tcp_stream>>(*conn.io_context);

    boost::asio::ip::tcp::resolver resolver{*conn.io_context};
    auto const results = resolver.resolve(service_info.at("Ip"), service_info.at("Port"));
    boost::beast::get_lowest_layer(*conn.ws).connect(results);

    if (!boost::beast::get_lowest_layer(*conn.ws).socket().is_open()) {
        std::cerr << "[Server] Failed to open TCP socket for " << service_name << std::endl;
        return false;
    }

    conn.ws->handshake(service_info.at("Ip"), service_info.at("RouteWs"));
    if (!conn.ws->is_open()) {
        std::cerr << "[Server] WebSocket handshake failed for " << service_name << std::endl;
        return false;
    }

    conn.is_connected = true;
    conn.io_thread = std::thread([io_ctx = conn.io_context]() {
        io_ctx->run();
    });

    std::cout << "[Server] Successfully connected to " << service_name
        << " at " << service_info.at("Ip") << ":" << service_info.at("Port")
        << service_info.at("RouteWs") << std::endl;

    return true;
}

void talkup_network::MicroservicesManager::create_service_worker(
    const std::string &service_name)
{
    auto& conn = __ws_connections[service_name];

    if (conn.worker_running)
        return;

    conn.worker_running = true;
    conn.worker_thread = std::thread([service_name]() {
        while (true) {
            talkup_network::MicroservicesManager::WebSocketConnection *conn_ptr = nullptr;
            {
                std::lock_guard<std::mutex> lock(__ws_mutex);
                auto it = __ws_connections.find(service_name);
                if (it == __ws_connections.end()) break;
                conn_ptr = &it->second;
            }
            if (!conn_ptr) break;

            talkup_network::MicroservicesManager::WebSocketConnection::SttJob job;
            {
                std::unique_lock<std::mutex> qlock(conn_ptr->queue_mutex);
                if (!conn_ptr->queue_cv.wait_for(qlock, std::chrono::seconds(5), 
                    [conn_ptr]{ return !conn_ptr->worker_running || !conn_ptr->job_queue.empty(); })) {
                    if (!conn_ptr->worker_running) break;
                    qlock.unlock();
                    talkup_network::MicroservicesManager::ping_service(service_name);
                    continue;
                }
                if (!conn_ptr->worker_running) break;
                if (conn_ptr->job_queue.empty()) {
                    continue;
                }
                job = std::move(conn_ptr->job_queue.front());
                conn_ptr->job_queue.pop();
            }
            try {
                process_stt_job(job.data, std::move(job.callback));
            } catch (const std::exception &e) {
                std::cerr << "[MicroservicesManager] Worker error for service " 
                          << service_name << ": " << e.what() << std::endl;
            }
        }
    });
}

void talkup_network::MicroservicesManager::initialize_ws_service_connections()
{
    std::lock_guard<std::mutex> lock(__ws_mutex);

    for (const auto& [service_name, service_info] : __services_list) {
        try {
            if (!connect_to_service(service_name, service_info))
                continue;

            create_service_worker(service_name);

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
    std::mutex *io_mutex = nullptr;
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
        io_mutex = &it->second.io_mutex;
    }

    if (io_mutex == nullptr) {
        std::cerr << "[MicroservicesManager] Missing IO mutex for service " << service_name << std::endl;
        return false;
    }

    std::unique_lock<std::mutex> io_lock(*io_mutex);
    try {
        nlohmann::json ping_json = {{"services", {service_id}}, {"type", "ping"}, {"timestamp", std::time(nullptr)},
            {"data", nlohmann::json::object()}};
        ws->write(boost::asio::buffer(ping_json.dump()));

        boost::beast::flat_buffer buffer;
        const int timeout_ms = 5000; // 5 seconds timeout for ping
        int fd = boost::beast::get_lowest_layer(*ws).socket().native_handle();
        struct pollfd pfd;
        pfd.fd = fd;
        pfd.events = POLLIN;
        pfd.revents = 0;

        int poll_ret = ::poll(&pfd, 1, timeout_ms);
        if (poll_ret <= 0) {
            if (poll_ret == 0) {
                std::cerr << "[MicroservicesManager] Ping timeout for service " << service_name << std::endl;
            } else {
                std::cerr << "[MicroservicesManager] Poll error while pinging " << service_name << ": " << std::strerror(errno) << std::endl;
            }
            return false;
        }

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
    const nlohmann::json &data, ResponseCallback callback)
{
    nlohmann::json err_response;
    bool enqueue_ok = false;

    {
        std::lock_guard<std::mutex> lock(__ws_mutex);
        auto it = __ws_connections.find("stt");
        if (it == __ws_connections.end() || !it->second.is_connected) {
            std::cerr << "[MicroservicesManager] STT connection not available" << std::endl;
            err_response = {{"error", "STT connection not available"}};
        } else {
            {
                std::lock_guard<std::mutex> qlock(it->second.queue_mutex);
                it->second.job_queue.push({data, std::move(callback)});
            }
            it->second.queue_cv.notify_one();
            enqueue_ok = true;
        }
    }

    if (!enqueue_ok && callback) {
        callback(err_response);
    }
}

void talkup_network::MicroservicesManager::process_stt_job(const nlohmann::json &data, ResponseCallback callback)
{
    try {
        nlohmann::json chunk_val = get_chunks_val_from_data(data);
        std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
        std::mutex *io_mutex = nullptr;
        {
            std::lock_guard<std::mutex> lock(__ws_mutex);
            auto it = __ws_connections.find("stt");
            if (it == __ws_connections.end() || !it->second.is_connected) {
                std::cerr << "[MicroservicesManager] STT connection not available" << std::endl;
                if (callback)
                    callback(nlohmann::json{{"error", "STT connection not available"}});
                return;
            }
            if (!it->second.ws || !it->second.ws->is_open()) {
                std::cerr << "[MicroservicesManager] STT WebSocket connection is closed" << std::endl;
                it->second.is_connected = false;
                if (callback)
                    callback(nlohmann::json{{"error", "STT connection closed"}});
                return;
            }
            ws = it->second.ws;
            io_mutex = &it->second.io_mutex;
        }

        if (!ping_service("stt")) {
            if (callback)
                callback(nlohmann::json{{"error", "STT service ping failed"}});
            return;
        }
        if (!ws || !ws->is_open()) {
            std::cerr << "[MicroservicesManager] STT WebSocket connection lost after ping" << std::endl;
            if (callback)
                callback(nlohmann::json{{"error", "STT connection lost after ping"}});
            return;
        }

        std::unique_lock<std::mutex> io_lock(*io_mutex);
        nlohmann::json audio_json = {{"services", {"STT"}}, {"type", "stream_chunk"}, {"timestamp", std::time(nullptr)},
            {"data", {{"chunk", chunk_val}, {"eof", true}}}};
        ws->write(boost::asio::buffer(audio_json.dump()));
        int fd = boost::beast::get_lowest_layer(*ws).socket().native_handle();
        struct pollfd pfd;
        pfd.fd = fd;
        pfd.events = POLLIN;

        while (true) {
            pfd.revents = 0;
            int poll_ret = ::poll(&pfd, 1, 100);
            if (poll_ret > 0 && (pfd.revents & POLLIN)) {
                boost::beast::flat_buffer temp_buf;
                ws->read(temp_buf);
                std::string msg = boost::beast::buffers_to_string(temp_buf.data());
                try {
                    nlohmann::json msg_json = nlohmann::json::parse(msg);
                    if (msg_json["type"] != "pong") {
                        std::cout << "[MicroservicesManager] Received STT result: " << msg_json.dump() << std::endl;
                        if (callback)
                            callback(msg_json);
                        return;
                    }
                    std::cout << "[MicroservicesManager] Discarding pong message" << std::endl;
                } catch (...) {
                    break;
                }
            } else {
                break;
            }
        }

        boost::beast::flat_buffer resp_buf;
        const int timeout_ms = 15000;
        pfd.revents = 0;

        int poll_ret = ::poll(&pfd, 1, timeout_ms);
        if (poll_ret > 0 && (pfd.revents & POLLIN)) {
            ws->read(resp_buf);
            std::string resp_msg = boost::beast::buffers_to_string(resp_buf.data());
            try {
                nlohmann::json resp_json = nlohmann::json::parse(resp_msg);
                std::cout << "[MicroservicesManager] Received STT result: " << resp_json.dump() << std::endl;
                if (callback)
                    callback(resp_json);
            } catch (const std::exception &e) {
                std::cerr << "[MicroservicesManager] Failed to parse response as JSON: " << e.what() << " ; raw=" << resp_msg << std::endl;
                if (callback)
                    callback(nlohmann::json{{"error", std::string("Parse error: ") + e.what()}});
            }
        } else if (poll_ret == 0) {
            std::cerr << "[MicroservicesManager] Read timed out after " << timeout_ms << " ms" << std::endl;
            if (callback)
                callback(nlohmann::json{{"error", "Read timeout"}});
        } else {
            std::cerr << "[MicroservicesManager] poll() error: " << std::strerror(errno) << std::endl;
            if (callback)
                callback(nlohmann::json{{"error", std::string("Poll error: ") + std::strerror(errno)}});
        }
    } catch (const std::exception &e) {
        std::cerr << "[MicroservicesManager] Exception: " << e.what() << std::endl;
        if (callback)
            callback(nlohmann::json{{"error", std::string("Exception: ") + e.what()}});
    }
}

void talkup_network::MicroservicesManager::start_service_worker(const std::string &service_name)
{
    std::lock_guard<std::mutex> lock(__ws_mutex);
    auto it = __ws_connections.find(service_name);
    if (it == __ws_connections.end()) return;
    auto &conn = it->second;

    if (conn.worker_running)
        return;
    conn.worker_running = true;
    conn.worker_thread = std::thread([service_name]() {
        while (true) {
            talkup_network::MicroservicesManager::WebSocketConnection *conn_ptr = nullptr;
            {
                std::lock_guard<std::mutex> lock(__ws_mutex);
                auto it = __ws_connections.find(service_name);
                if (it == __ws_connections.end()) break;
                conn_ptr = &it->second;
            }
            if (!conn_ptr) break;

            talkup_network::MicroservicesManager::WebSocketConnection::SttJob job;
            {
                std::unique_lock<std::mutex> qlock(conn_ptr->queue_mutex);
                if (!conn_ptr->queue_cv.wait_for(qlock, std::chrono::seconds(5), [conn_ptr]{ return !conn_ptr->worker_running 
                        || !conn_ptr->job_queue.empty(); })) {
                            if (!conn_ptr->worker_running) break;
                            qlock.unlock();
                            talkup_network::MicroservicesManager::ping_service(service_name);
                            continue;
                }
                if (!conn_ptr->worker_running)
                    break;
                if (conn_ptr->job_queue.empty())
                    continue;
                job = std::move(conn_ptr->job_queue.front());
                conn_ptr->job_queue.pop();
            }
            try {
                process_stt_job(job.data, std::move(job.callback));
            } catch (const std::exception &e) {
                std::cerr << "[MicroservicesManager] Worker error for service " << service_name << ": " << e.what() << std::endl;
            }
        }
    });
}

void talkup_network::MicroservicesManager::stop_service_worker(const std::string &service_name)
{
    std::lock_guard<std::mutex> lock(__ws_mutex);
    auto it = __ws_connections.find(service_name);
    if (it == __ws_connections.end()) return;
    auto &conn = it->second;

    if (!conn.worker_running) return;
    {
        std::lock_guard<std::mutex> qlock(conn.queue_mutex);
        conn.worker_running = false;
    }
    conn.queue_cv.notify_all();
    if (conn.worker_thread.joinable()) conn.worker_thread.join();
}

void talkup_network::MicroservicesManager::end_to_tts_microservice(
    const nlohmann::json &data, ResponseCallback callback)
{
    std::thread([data, callback]() {
        try {
            if (data.contains("error") ||
                (data.contains("type") && data["type"].is_string() && data["type"] == "error")) {
                callback(nlohmann::json{{"error", "Invalid STT response for TTS chaining"}, {"details", data}});
                return;
            }

            nlohmann::json text_val = extract_text_from_stt_response(data);
            if (!text_val.is_string() || text_val.get<std::string>().empty()) {
                std::cerr << "[MicroservicesManager] STT response does not contain usable text for TTS: "
                          << data.dump() << std::endl;
                callback(nlohmann::json{{"error", "No text found in STT response"}});
                return;
            }

            std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
            {
                std::lock_guard<std::mutex> lock(__ws_mutex);
                auto it = __ws_connections.find("tts");
                if (it == __ws_connections.end() || !it->second.is_connected) {
                    std::cerr << "[MicroservicesManager] TTS connection not available" << std::endl;
                    callback(nlohmann::json{{"error", "TTS connection not available"}});
                    return;
                }
                if (!it->second.ws || !it->second.ws->is_open()) {
                    std::cerr << "[MicroservicesManager] TTS WebSocket connection is closed" << std::endl;
                    it->second.is_connected = false;
                    callback(nlohmann::json{{"error", "TTS connection closed"}});
                    return;
                }
                ws = it->second.ws;
            }

            if (!ping_service("tts")) {
                callback(nlohmann::json{{"error", "TTS service ping failed"}});
                return;
            }

            if (!ws || !ws->is_open()) {
                std::cerr << "[MicroservicesManager] TTS WebSocket connection lost after ping" << std::endl;
                callback(nlohmann::json{{"error", "TTS connection lost after ping"}});
                return;
            }

            nlohmann::json tts_json = {
                {"services", {"TTS"}},
                {"type", "stream_chunk"},
                {"timestamp", std::time(nullptr)},
                {"data", {{"chunk", text_val}, {"eof", true}}}
            };

            ws->write(boost::asio::buffer(tts_json.dump()));

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
                    std::cout << "[MicroservicesManager] Received TTS response: " << resp_json.dump() << std::endl;
                    callback(resp_json);
                } catch (const std::exception &e) {
                    std::cerr << "[MicroservicesManager] Failed to parse TTS response as JSON: "
                              << e.what() << " ; raw=" << resp_msg << std::endl;
                    callback(nlohmann::json{{"error", std::string("Parse error: ") + e.what()}});
                }
            } else if (poll_ret == 0) {
                std::cerr << "[MicroservicesManager] TTS read timed out after " << timeout_ms << " ms" << std::endl;
                callback(nlohmann::json{{"error", "Read timeout"}});
            } else {
                std::cerr << "[MicroservicesManager] TTS poll() error: " << std::strerror(errno) << std::endl;
                callback(nlohmann::json{{"error", std::string("Poll error: ") + std::strerror(errno)}});
            }
        } catch (const std::exception &e) {
            std::cerr << "[MicroservicesManager] Exception while sending to TTS: " << e.what() << std::endl;
            callback(nlohmann::json{{"error", std::string("Exception: ") + e.what()}});
        }
    }).detach();
}
