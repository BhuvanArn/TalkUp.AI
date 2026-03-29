/*
** EPITECH PROJECT, 2025
** TalkUp.AI
** File description:
** This file defines the Server class, which is responsible
** for managing the server operations.
*/

#pragma once

#include "network/MicroservicesManager.hpp"
#include "IServer.hpp"

namespace talkup_network {
    class Server : public IServer {
        public:
            Server() = delete;

            /**
             * @brief Construct a new Server object
             *
             * @param server_name
             * @param server_version
             */
            Server(const std::string &server_name,
                const std::string &server_version, int port);

            /**
             * @brief Destroy the Server object
             *
             */
            ~Server();

            /**
             * @brief Start the server on a specific port.
             *
             * @param port
             * @return true
             * @return false
             */
            bool start_server(crow::SimpleApp &app) override;

            /**
             * @brief Stop the server.
             *
             * @return true
             * @return false
             */
            bool stop_server(void) override;

            /**
             * @brief Get the server name.
             *
             * @return std::string
             */
            std::string get_server_name(void) const override;

            /**
             * @brief Get the server version.
             *
             * @return std::string
             */
            std::string get_server_version(void) const override;

            /**
             * @brief Get the port number.
             *
             * @return int
             */
            int get_port_number(void) const override;

            /**
             * @brief Enable or disable console notifications.
             *
             * @param value
             */
            void set_console_notification(const bool value) override;

            std::shared_ptr<talkup_network::Router> router;
            bool is_running = false;

        protected:
        private:
            std::shared_ptr<MicroservicesManager> __microservices_manager;

            std::string __server_name;
            std::string __server_version;

            int __port;

            bool __console_notification;
    };
}
