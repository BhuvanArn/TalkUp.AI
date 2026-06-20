/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** This file contains the declaration of the WebsocketManager class,
** which is responsible for managing WebSocket connections and communications.
*/

#pragma once

#include <string>
#include <cstdint>
#include <nlohmann/json.hpp>
#include <crow.h>
#include <memory>

#include "MicroservicesManager.hpp"

namespace talkup_network {
    class WsManager {
        public:

            /**
             * @brief Construct a new WsManager object
             *
             */
            WsManager();

            /**
             * @brief Destroy the WsManager object
             *
             */
            ~WsManager() = default;

            /**
             * @brief Struct to hold WebSocket connection information.
             */
            struct WebSocketConnectionInfo {
                std::string type;
                std::string key;
                std::string stream_id;
                std::string format;
                int64_t timestamp;
                std::string data;
            };

            /**
             * @brief Manage the type of connection.
             * Based on the communication protocol, it will handle the type of connection.
             * (e.g., ping, stream_chunk, error...)
             *
             * @param j The JSON object containing the message data.
             * @param conn The WebSocket connection object.
             */
            void connection_type_manager(nlohmann::json &json, crow::websocket::connection& conn,
                std::shared_ptr<MicroservicesManager> microservices_manager);

            /**
             * @brief With the given parameters, it will set the respond JSON format and return it.
             *
             * @param type The type of the message.
             * @param key The key associated with the message.
             * @param stream_id The stream ID associated with the message.
             * @param format The format of the message.
             * @param timestamp The timestamp of the message.
             * @param data The data of the message.
             */
            nlohmann::json set_respond_json_format(const WebSocketConnectionInfo& info) const;

        protected:

            /**
             * @brief Handle a ping message from the client.
             *
             * @param json The JSON object containing the ping message.
             * @param conn The WebSocket connection object.
             */
            void handle_ping(const nlohmann::json& json, crow::websocket::connection& conn);

            /**
             * @brief Handle a stream chunk message from the client.
             *
             * @param json The JSON object containing the stream chunk message.
             * @param conn The WebSocket connection object.
             */
            void handle_stream_chunk(const nlohmann::json& json, crow::websocket::connection& conn,
                std::shared_ptr<MicroservicesManager> microservices_manager);

            void handle_simulation_context(const nlohmann::json& json, crow::websocket::connection& conn,
                std::shared_ptr<MicroservicesManager> microservices_manager);

        private:
            std::unordered_map<std::string, std::function<void(const nlohmann::json&,
                crow::websocket::connection&, std::shared_ptr<MicroservicesManager>)>> _type_handlers;
    };
}
