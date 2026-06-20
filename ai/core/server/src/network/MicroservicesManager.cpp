/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** Implementation of the MicroservicesManager class
*/

#include "MicroservicesManager.hpp"

#include <algorithm>
#include <atomic>
#include <chrono>

namespace {
    std::atomic<uint64_t> g_sts_request_id{0};

    nlohmann::json extract_text_from_sts_response(const nlohmann::json &data)
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
    // Do not run io_context on a second thread: sync read/write must stay on the worker thread.

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

            talkup_network::MicroservicesManager::WebSocketConnection::StsJob job;
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
                process_sts_job(job.data, std::move(job.callback));
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

bool talkup_network::MicroservicesManager::reconnect_service_connection(
    const std::string &service_name)
{
    std::unordered_map<std::string, std::string> service_info;

    {
        std::lock_guard<std::mutex> lock(__ws_mutex);
        auto info_it = __services_list.find(service_name);
        if (info_it == __services_list.end())
            return false;
        service_info = info_it->second;

        auto conn_it = __ws_connections.find(service_name);
        if (conn_it != __ws_connections.end()) {
            auto &conn = conn_it->second;
            if (conn.ws && conn.ws->is_open()) {
                boost::system::error_code ec;
                conn.ws->close(boost::beast::websocket::close_code::normal, ec);
            }
            if (conn.io_context)
                conn.io_context->stop();
            if (conn.io_thread.joinable())
                conn.io_thread.join();
            conn.ws.reset();
            conn.io_context.reset();
            conn.is_connected = false;
        }
    }

    std::cout << "[MicroservicesManager] Reconnecting to " << service_name << "..." << std::endl;
    std::lock_guard<std::mutex> connect_lock(__ws_mutex);
    return connect_to_service(service_name, service_info);
}

static bool read_sts_json_message(
    boost::beast::websocket::stream<boost::beast::tcp_stream> &ws,
    nlohmann::json &out,
    int timeout_ms)
{
    int fd = boost::beast::get_lowest_layer(ws).socket().native_handle();
    struct pollfd pfd;
    pfd.fd = fd;
    pfd.events = POLLIN;
    pfd.revents = 0;

    int poll_ret = ::poll(&pfd, 1, timeout_ms);
    if (poll_ret <= 0)
        return false;

    boost::beast::flat_buffer buffer;
    ws.read(buffer);
    std::string msg = boost::beast::buffers_to_string(buffer.data());
    try {
        out = nlohmann::json::parse(msg);
    } catch (const std::exception &) {
        std::cerr << "[MicroservicesManager] Ignoring non-JSON STS message" << std::endl;
        return false;
    }
    return true;
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

    std::unique_lock<std::mutex> io_lock(*io_mutex, std::try_to_lock);
    if (!io_lock.owns_lock()) {
        return true;
    }
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

void talkup_network::MicroservicesManager::send_to_sts_microservice(
    const nlohmann::json &data, ResponseCallback callback)
{
    nlohmann::json err_response;
    bool enqueue_ok = false;

    {
        std::lock_guard<std::mutex> lock(__ws_mutex);
        auto it = __ws_connections.find("sts");
        if (it == __ws_connections.end() || !it->second.is_connected) {
            std::cerr << "[MicroservicesManager] STS connection not available" << std::endl;
            err_response = {{"error", "STS connection not available"}};
        } else {
            {
                std::lock_guard<std::mutex> qlock(it->second.queue_mutex);
                it->second.job_queue.push({data, std::move(callback)});
            }
            it->second.queue_cv.notify_one();
            enqueue_ok = true;
            std::cout << "[MicroservicesManager] Enqueued STS job (queue size pending)" << std::endl;
        }
    }

    if (!enqueue_ok && callback) {
        callback(err_response);
    }
}

bool talkup_network::MicroservicesManager::send_simulation_context_to_sts(
    const std::string &interview_id,
    const nlohmann::json &context_data)
{
    if (interview_id.empty()) {
        std::cerr << "[MicroservicesManager] simulation_context: missing interview_id" << std::endl;
        return false;
    }

    try {
        std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
        std::mutex *io_mutex = nullptr;

        {
            std::lock_guard<std::mutex> lock(__ws_mutex);
            auto it = __ws_connections.find("sts");
            if (it == __ws_connections.end() || !it->second.is_connected ||
                !it->second.ws || !it->second.ws->is_open()) {
                if (!reconnect_service_connection("sts")) {
                    std::cerr << "[MicroservicesManager] STS connection not available for simulation_context" << std::endl;
                    return false;
                }
                it = __ws_connections.find("sts");
            }
            if (it == __ws_connections.end() || !it->second.ws) {
                return false;
            }
            ws = it->second.ws;
            io_mutex = &it->second.io_mutex;
        }

        std::unique_lock<std::mutex> io_lock(*io_mutex);
        nlohmann::json payload = {
            {"services", {"STS"}},
            {"type", "simulation_context"},
            {"interview_id", interview_id},
            {"timestamp", std::time(nullptr)},
            {"data", context_data},
        };
        ws->write(boost::asio::buffer(payload.dump()));
        std::cout << "[MicroservicesManager] Sent simulation_context for interview_id="
                  << interview_id << std::endl;

        const int timeout_ms = 15000;
        const auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(timeout_ms);

        while (std::chrono::steady_clock::now() < deadline) {
            const int remaining_ms = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(
                deadline - std::chrono::steady_clock::now()).count());
            if (remaining_ms <= 0)
                break;

            nlohmann::json msg_json;
            if (!read_sts_json_message(*ws, msg_json, std::min(remaining_ms, 5000)))
                continue;

            const std::string msg_type = msg_json.value("type", "");
            if (msg_type == "pong")
                continue;

            if (msg_type == "simulation_context_ack") {
                const std::string ack_id = msg_json.value("interview_id", "");
                if (ack_id.empty() || ack_id == interview_id)
                    return true;
            }

            if (msg_type == "error") {
                std::cerr << "[MicroservicesManager] STS simulation_context error: "
                          << msg_json.dump() << std::endl;
                return false;
            }
        }

        std::cerr << "[MicroservicesManager] simulation_context ack timeout for "
                  << interview_id << std::endl;
        return false;
    } catch (const std::exception &e) {
        std::cerr << "[MicroservicesManager] simulation_context exception: " << e.what() << std::endl;
        return false;
    }
}

void talkup_network::MicroservicesManager::process_sts_job(const nlohmann::json &data, ResponseCallback callback)
{
    try {
        nlohmann::json chunk_val = get_chunks_val_from_data(data);
        std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
        std::mutex *io_mutex = nullptr;

        {
            std::lock_guard<std::mutex> lock(__ws_mutex);
            auto it = __ws_connections.find("sts");
            if (it == __ws_connections.end() || !it->second.is_connected ||
                !it->second.ws || !it->second.ws->is_open()) {
                if (it != __ws_connections.end())
                    it->second.is_connected = false;
            } else {
                ws = it->second.ws;
                io_mutex = &it->second.io_mutex;
            }
        }

        if (!ws || !io_mutex) {
            if (!reconnect_service_connection("sts")) {
                std::cerr << "[MicroservicesManager] STS connection not available" << std::endl;
                if (callback)
                    callback(nlohmann::json{{"error", "STS connection not available"}});
                return;
            }
            std::lock_guard<std::mutex> lock(__ws_mutex);
            auto it = __ws_connections.find("sts");
            if (it == __ws_connections.end() || !it->second.ws) {
                if (callback)
                    callback(nlohmann::json{{"error", "STS connection not available"}});
                return;
            }
            ws = it->second.ws;
            io_mutex = &it->second.io_mutex;
        }

        std::unique_lock<std::mutex> io_lock(*io_mutex);
        const uint64_t request_id = ++g_sts_request_id;
        std::string interview_id;
        if (data.contains("stream_id") && data["stream_id"].is_string())
            interview_id = data["stream_id"].get<std::string>();
        nlohmann::json audio_json = {{"services", {"STS"}}, {"type", "stream_chunk"}, {"request_id", request_id},
            {"timestamp", std::time(nullptr)}, {"data", {{"chunk", chunk_val}, {"eof", true}}}};
        if (!interview_id.empty())
            audio_json["interview_id"] = interview_id;
        ws->write(boost::asio::buffer(audio_json.dump()));
        std::cout << "[MicroservicesManager] Sent STS stream_chunk request_id=" << request_id << std::endl;

        const int timeout_ms = 300000;
        const auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(timeout_ms);

        while (std::chrono::steady_clock::now() < deadline) {
            const int remaining_ms = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(
                deadline - std::chrono::steady_clock::now()).count());
            if (remaining_ms <= 0)
                break;

            nlohmann::json msg_json;
            if (!read_sts_json_message(*ws, msg_json, std::min(remaining_ms, 30000)))
                continue;

            const std::string msg_type = msg_json.value("type", "");
            if (msg_type == "pong") {
                continue;
            }

            if (msg_json.contains("request_id")) {
                const uint64_t response_id = msg_json.value("request_id", static_cast<uint64_t>(0));
                if (response_id != request_id) {
                    std::cout << "[MicroservicesManager] Ignoring STS message for request_id="
                              << response_id << " (expected " << request_id << ")" << std::endl;
                    continue;
                }
            }

            std::cout << "[MicroservicesManager] Received STS message type=" << msg_type
                      << " request_id=" << request_id << std::endl;
            io_lock.unlock();
            if (callback)
                callback(msg_json);
            return;
        }

        std::cerr << "[MicroservicesManager] Read timed out after " << timeout_ms << " ms" << std::endl;
        io_lock.unlock();
        if (callback)
            callback(nlohmann::json{{"type", "error"}, {"error", "Read timeout"}});
    } catch (const std::exception &e) {
        std::cerr << "[MicroservicesManager] Exception: " << e.what() << std::endl;
        {
            std::lock_guard<std::mutex> lock(__ws_mutex);
            auto it = __ws_connections.find("sts");
            if (it != __ws_connections.end())
                it->second.is_connected = false;
        }
        reconnect_service_connection("sts");
        if (callback)
            callback(nlohmann::json{{"type", "error"}, {"error", std::string("Exception: ") + e.what()}});
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

            talkup_network::MicroservicesManager::WebSocketConnection::StsJob job;
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
                process_sts_job(job.data, std::move(job.callback));
            } catch (const std::exception &e) {
                std::cerr << "[MicroservicesManager] Worker error for service " << service_name << ": " << e.what() << std::endl;
            }
        }
    });
}

void talkup_network::MicroservicesManager::stop_service_worker(const std::string &service_name)
{
    std::thread worker_to_join;

    {
        std::lock_guard<std::mutex> lock(__ws_mutex);
        auto it = __ws_connections.find(service_name);
        if (it == __ws_connections.end()) return;
        auto &conn = it->second;

        if (!conn.worker_running && !conn.worker_thread.joinable()) return;
        {
            std::lock_guard<std::mutex> qlock(conn.queue_mutex);
            conn.worker_running = false;
        }
        conn.queue_cv.notify_all();
        // Move the thread out and join after releasing __ws_mutex: the worker
        // loop re-acquires __ws_mutex each iteration, so joining while holding
        // it would deadlock.
        worker_to_join = std::move(conn.worker_thread);
    }

    if (worker_to_join.joinable())
        worker_to_join.join();
}

void talkup_network::MicroservicesManager::shutdown()
{
    // Snapshot the service names under a brief lock, then release __ws_mutex:
    // stop_service_worker() re-locks __ws_mutex and joins the worker thread,
    // both of which would deadlock if we held the lock across this loop.
    std::vector<std::string> service_names;
    {
        std::lock_guard<std::mutex> lock(__ws_mutex);
        service_names.reserve(__ws_connections.size());
        for (const auto &[service_name, conn] : __ws_connections)
            service_names.push_back(service_name);
    }

    for (const auto &service_name : service_names) {
        stop_service_worker(service_name);

        std::thread io_to_join;
        {
            std::lock_guard<std::mutex> lock(__ws_mutex);
            auto it = __ws_connections.find(service_name);
            if (it == __ws_connections.end()) continue;
            auto &conn = it->second;

            if (conn.ws && conn.ws->is_open()) {
                boost::system::error_code ec;
                conn.ws->close(boost::beast::websocket::close_code::normal, ec);
                if (ec) {
                    std::cerr << "[MicroservicesManager] Error closing WebSocket for service " << service_name << ": " << ec.message() << std::endl;
                }
            }
            if (conn.io_context)
                conn.io_context->stop();
            // Join the io thread outside __ws_mutex for the same reason as the worker.
            io_to_join = std::move(conn.io_thread);
        }

        if (io_to_join.joinable())
            io_to_join.join();
    }
}
