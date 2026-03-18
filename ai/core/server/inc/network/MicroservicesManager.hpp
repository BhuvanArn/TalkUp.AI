/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** This file defines the MicroservicesManager class, which is responsible
** for managing microservices in the TalkUp.AI server.
*/

#pragma once

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/connect.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <sys/poll.h>
#include <cerrno>
#include <cstring>
#include <nlohmann/json.hpp>
#include <string>
#include <unordered_map>
#include <iostream>
#include <fstream>
#include <thread>
#include <mutex>
#include <memory>
#include <crow.h>

#include "ExceptionManager.hpp"

using ResponseCallback = std::function<void(const nlohmann::json&)>;

namespace talkup_network {
    class MicroservicesManager {
        public:
            /**
             * @brief Construct a new MicroservicesManager object
             *
             */
            MicroservicesManager() = default;

            /**
             * @brief Destroy the MicroservicesManager object
             *
             */
            ~MicroservicesManager() = default;

            /**
             * @brief Load the microservices information from a JSON file.
             *
             * @param file_path
             */
            static void load_microservices_info(
                const std::string &file_path = "../../services.json");

            /**
             * @brief Get the list of services.
             *
             * @return std::unordered_map<std::string, std::string>
             */
            static const std::unordered_map<std::string,
                std::unordered_map<std::string, std::string>>& get_services_list();

            /**
             * @brief Send data to the STT microservice.
             * This function will send audio data to the STT microservice for processing.
             * It will first check if the STT microservice is registered in the services list.
             * If it is, it will send a ping request to ensure the microservice is reachable. If the ping is successful,
             * it will then send the audio data to the microservice.
             *
             * @param data Json data containing the audio information to be sent to the STT microservice.
             */
            static void send_to_stt_microservice(const nlohmann::json &data, ResponseCallback callback);

            /**
             * @brief Send STT output text to the TTS microservice.
             * This function validates the STT payload, checks TTS availability via ping,
             * then requests speech synthesis and returns the TTS response through callback.
             *
             * @param data Json data containing STT output (expected to include text).
             */
            static void end_to_tts_microservice(const nlohmann::json &data, ResponseCallback callback);

            /**
             * @brief Initialize WebSocket connections to all registered microservices.
             * It's establishes persistent WebSocket connections to each microservice
             * defined in the services list. It handles connection setup, error reporting,
             * and maintains the connection state for future communications.
             */
            static void initialize_ws_service_connections();

            /**
             * @brief Extract chunk values from the provided data JSON.
             * This function processes the input JSON to retrieve audio chunk data,
             * handling various possible structures of the input.
             *
             * @param data The input JSON containing audio data.
             * @return nlohmann::json The extracted chunk values.
             */
            static nlohmann::json get_chunks_val_from_data(const nlohmann::json &data);

            /**
             * @brief Ping a specific microservice to check its availability.
             *
             * @param service_name The name of the microservice to ping.
             * @return true if the service responds to the ping, false otherwise.
             */
            static bool ping_service(const std::string &service_name);

        protected:
        private:
            struct WebSocketConnection {
                std::shared_ptr<boost::asio::io_context> io_context;
                std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
                std::shared_ptr<std::mutex> io_mutex;
                std::thread io_thread;
                bool is_connected = false;
            };

            static bool reconnect_service_connection(const std::string& service_name);

            static inline std::unordered_map<std::string,
                std::unordered_map<std::string, std::string>> __services_list;

            static inline std::unordered_map<std::string, WebSocketConnection> __ws_connections;
            static inline std::mutex __ws_mutex;
    };
}
