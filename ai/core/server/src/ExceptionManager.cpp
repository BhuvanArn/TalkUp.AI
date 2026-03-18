/*
** EPITECH PROJECT, 2025
** TalkUp.AI
** File description:
** ExceptionManager
*/

#include "ExceptionManager.hpp"

const char *ExceptionManager::StartServerException::what() const noexcept
{
    return "Failed to start the server.";
}

const char *ExceptionManager::StopServerException::what() const noexcept
{
    return "Failed to stop the server.";
}

const char *ExceptionManager::ServerAlreadyRunningException::what() const noexcept
{
    return "The server is already running.";
}

const char *ExceptionManager::NetworkBindException::what() const noexcept
{
    return "Failed to bind to the specified port.";
}

const char *ExceptionManager::NetworkMissingTypeField::what() const noexcept
{
    return "Missing type field in network message.";
}

const char *ExceptionManager::NetworkInvalidJsonException::what() const noexcept
{
    return "Invalid JSON received in network message.";
}

const char *ExceptionManager::NetworkUnknownTypeException::what() const noexcept
{
    return "Unknown type received in network message.";
}

const char *ExceptionManager::NetworkInvalidKeyException::what() const noexcept
{
    return "Invalid key received in network message.";
}

const char *ExceptionManager::NetworkEmptyBodyException::what() const noexcept
{
    return "Empty body received in network message.";
}

const char *ExceptionManager::MicroserviceNotRegisteredException::what() const noexcept
{
    return "The requested microservice is not registered.";
}