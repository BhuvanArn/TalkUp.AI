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
#include <vector>
#include <unordered_map>
#include <iostream>
#include <fstream>
#include <thread>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <memory>
#include <functional>
#include <future>

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
             * @brief Send audio data to the STS microservice.
             * This function will send the incoming audio chunk to the STS service for processing.
             * It will first check if the STS microservice is registered in the services list.
             * If it is, it will send a ping request to ensure the microservice is reachable.
             *
             * @param data Json data containing the audio information to be sent to the STS microservice.
             */
            static void send_to_sts_microservice(const nlohmann::json &data, ResponseCallback callback);

            /**
             * @brief Push structured simulation context (company, job offer) to STS for one interview.
             * @return true if STS acknowledged registration.
             */
            static bool send_simulation_context_to_sts(
                const std::string &interview_id,
                const nlohmann::json &context_data);

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

            /**
             * @brief Gracefully stop workers and close all WS connections.
             */
            static void shutdown();

        protected:
        private:
            struct WebSocketConnection {
                enum class StsJobKind {
                    StreamChunk,
                    SimulationContext,
                };

                struct StsJob {
                    StsJobKind kind = StsJobKind::StreamChunk;
                    nlohmann::json data;
                    ResponseCallback callback;
                    std::string interview_id;
                    nlohmann::json context_data;
                    std::shared_ptr<std::promise<bool>> context_promise;
                };

                std::shared_ptr<boost::asio::io_context> io_context;
                std::shared_ptr<boost::beast::websocket::stream<boost::beast::tcp_stream>> ws;
                std::thread io_thread;
                bool is_connected = false;
                std::mutex io_mutex;
                std::queue<StsJob> job_queue;
                std::thread worker_thread;
                std::mutex queue_mutex;
                std::condition_variable queue_cv;
                bool worker_running = false;
                bool reconnecting = false;
            };

            static bool reconnect_service_connection(const std::string& service_name);

            static inline std::unordered_map<std::string,
                std::unordered_map<std::string, std::string>> __services_list;

            static inline std::unordered_map<std::string, WebSocketConnection> __ws_connections;
            static inline std::mutex __ws_mutex;

            /**
             * @brief Connect to a single microservice via WebSocket.
             *
             * @param service_name The name of the service to connect to.
             * @param service_info The connection information (IP, Port, RouteWs).
             * @return true if connection was successful, false otherwise.
             */
            static bool connect_to_service(
                const std::string &service_name,
                const std::unordered_map<std::string, std::string> &service_info);

            /**
             * @brief Create and start a worker thread for processing service jobs.
             *
             * @param service_name The name of the service.
             */
            static void create_service_worker(const std::string &service_name);

            /**
             * @brief Start a worker thread for a specific microservice.
             */
            static void start_service_worker(const std::string &service_name);

            /**
             * @brief Stop the worker thread for a specific microservice.
             */
            static void stop_service_worker(const std::string &service_name);

            /**
             * @brief Process a job for the STS microservice.
             *
             * @param data The JSON data containing the job information.
             */
            static void process_sts_job(const nlohmann::json &data, ResponseCallback callback);

            static void process_simulation_context_job(
                const std::string &interview_id,
                const nlohmann::json &context_data,
                const std::shared_ptr<std::promise<bool>> &result_promise);
    };
}
