/*
** Talkup Project, 2026
** TalkUp.AI
** Tracks frontend WebSocket lifetime for safe async STS/VA replies.
*/

#pragma once

#include <atomic>
#include <memory>
#include <mutex>
#include <unordered_map>

#include <crow.h>

namespace talkup_network {

class WsClientSession : public std::enable_shared_from_this<WsClientSession> {
    public:
        static std::shared_ptr<WsClientSession> bind(crow::websocket::connection &conn);
        static void close(crow::websocket::connection &conn);

        bool is_open() const;
        bool send_text(const std::string &text);

    private:
        explicit WsClientSession(crow::websocket::connection &conn);

        crow::websocket::connection *conn_;
        std::atomic<bool> open_{true};

        static std::mutex registry_mutex_;
        static std::unordered_map<crow::websocket::connection *,
            std::weak_ptr<WsClientSession>> registry_;
};

} // namespace talkup_network
