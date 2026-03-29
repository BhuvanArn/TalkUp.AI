/*
** EPITECH PROJECT, 2025
** TalkUp.AI
** File description:
** This file defines the ExceptionManager class, which is responsible
// for managing exceptions in the TalkUp.AI server.
*/

#pragma once

#include <exception>

class ExceptionManager {
    public:
        /**
         * @brief Construct a new Exception Manager object
         *
         */
        ExceptionManager() = default;

        /**
         * @brief Destroy the Exception Manager object
         *
         */
        ~ExceptionManager() = default;

        // Notification Category

        // Server Category

        /**
         * @brief Throws an exception if the server does not start correctly
         *
         */
        class StartServerException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        /**
         * @brief Throws an exception if the server does not stop correctly
         *
         */
        class StopServerException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        /**
         * @brief Exception thrown when the server is already running.
         *
         */
        class ServerAlreadyRunningException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        // Network category

        /**
         * @brief Exception thrown when the network fails to bind to the specified port.
         *
         */
        class NetworkBindException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        /**
         * @brief Exception thrown when the network receives a message without a type field.
         *
         */
        class NetworkMissingTypeField : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        /**
         * @brief Exception thrown when the network receives invalid JSON.
         *
         */
        class NetworkInvalidJsonException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        /**
         * @brief Exception thrown when the network receives an unknown type.
         *
         */
        class NetworkUnknownTypeException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        class NetworkInvalidKeyException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

        class NetworkEmptyBodyException : public std::exception {
            public:
                const char *what() const noexcept override;
        };


        class MicroserviceNotRegisteredException : public std::exception {
            public:
                const char *what() const noexcept override;
        };

    protected:
    private:
};
