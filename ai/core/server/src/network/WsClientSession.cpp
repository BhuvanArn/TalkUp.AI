/*
** Talkup Project, 2026
** TalkUp.AI
** Implementation of WsClientSession.
*/

#include "WsClientSession.hpp"

#include "MicroservicesManager.hpp"

#include <iostream>

namespace talkup_network {

std::mutex WsClientSession::registry_mutex_;
std::unordered_map<crow::websocket::connection *, std::weak_ptr<WsClientSession>>
    WsClientSession::registry_;

WsClientSession::WsClientSession(crow::websocket::connection &conn)
    : conn_(&conn)
{
}

std::shared_ptr<WsClientSession> WsClientSession::bind(crow::websocket::connection &conn)
{
    std::lock_guard<std::mutex> lock(registry_mutex_);
    auto it = registry_.find(&conn);
    if (it != registry_.end()) {
        if (auto existing = it->second.lock())
            return existing;
    }

    auto session = std::shared_ptr<WsClientSession>(new WsClientSession(conn));
    registry_[&conn] = session;
    return session;
}

void WsClientSession::close(crow::websocket::connection &conn)
{
    std::shared_ptr<WsClientSession> session;
    {
        std::lock_guard<std::mutex> lock(registry_mutex_);
        auto it = registry_.find(&conn);
        if (it != registry_.end()) {
            session = it->second.lock();
            registry_.erase(it);
        }
    }

    if (!session)
        return;

    session->open_.store(false);
    MicroservicesManager::cancel_va_followups_for_client(session);
}

bool WsClientSession::is_open() const
{
    return open_.load() && conn_ != nullptr;
}

bool WsClientSession::send_text(const std::string &text)
{
    if (!is_open())
        return false;

    try {
        conn_->send_text(text);
        return true;
    } catch (const std::exception &e) {
        std::cerr << "[WsClientSession] send_text failed: " << e.what() << std::endl;
        open_.store(false);
        return false;
    }
}

} // namespace talkup_network
