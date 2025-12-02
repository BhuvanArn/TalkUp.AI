/*
** Talkup Project, 2025
** TalkUp.AI
** File description:
** This file defines the MicroservicesManager class, which is responsible
** for managing microservices in the TalkUp.AI server.
*/

#pragma once

#include <nlohmann/json.hpp>
#include <string>
#include <unordered_map>
#include <iostream>
#include <fstream>
#include <crow.h>

#include "ExceptionManager.hpp"

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
            static void send_to_stt_microservice(const nlohmann::json &data);

        protected:
        private:
            static inline std::unordered_map<std::string,
                std::unordered_map<std::string, std::string>> __services_list;
    };
}
