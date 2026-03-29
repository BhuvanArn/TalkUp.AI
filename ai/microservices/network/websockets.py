##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This is the websockets.py of the microservices network.
##

import json
import os
import sys

from network.protocol import Message, create_message
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect


class WebSocketMicroservice:
    def __init__(self, name: str, websocket: WebSocket, owner: object = None):
        """
        Initialize a WebSocketMicroservice instance.
        """
        self.service_name = name
        self.websocket = websocket
        self.owner = owner

    async def send(self, ws: WebSocket, service, msg_type, data):
        msg = create_message(service, msg_type, data)
        print(f"[{self.service_name}] Sending message: {msg}")
        await ws.send_text(msg.model_dump_json())

    async def on_stream_chunk(self, ws: WebSocket, msg: Message):
        """Override for processing stream chunks."""
        pass

    async def on_process_request(self, ws: WebSocket, msg: Message):
        """Override for processing requests."""
        pass

    async def _parse_message(self, raw: str) -> tuple[Message | None, list[str]]:
        """
        Parse a raw JSON string into a Message object.

        Returns:
            Tuple of (Message object or None, list of services)
        """
        services = [self.service_name]

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as e:
            await self.send(self.websocket, services, "error", {"message": f"Invalid JSON: {str(e)}"})
            return None, services

        if "data" not in payload:
            payload["data"] = None

        try:
            msg = Message(**payload)
            return msg, msg.services
        except Exception as e:
            services = payload.get("services", [self.service_name])
            await self.send(self.websocket, services, "error", {"message": f"Invalid Message payload: {str(e)}"})
            return None, services

    async def _route_message(self, msg: Message) -> None:
        """
        Route incoming message to appropriate handler based on message type.
        """
        match msg.type:
            case "ping":
                await self.send(self.websocket, msg.services, "pong", {"status": "active"})
            case "stream_chunk":
                handler = (
                    self.owner.on_stream_chunk
                    if self.owner and hasattr(self.owner, "on_stream_chunk")
                    else self.on_stream_chunk
                )
                await handler(self.websocket, msg)
            case "process_request":
                handler = (
                    self.owner.on_process_request
                    if self.owner and hasattr(self.owner, "on_process_request")
                    else self.on_process_request
                )
                await handler(self.websocket, msg)
            case _:
                await self.send(self.websocket, msg.services, "error", {"message": f"Unknown message type: {msg.type}"})

    async def _handle_error(self, error: Exception, services: list[str]) -> bool:
        """
        Handle errors during message processing.

        Returns:
            True if connection should be closed, False otherwise
        """
        if isinstance(error, WebSocketDisconnect):
            print(f"[{self.service_name}] Client disconnected (code={error.code})")
            return True

        try:
            await self.send(self.websocket, services, "error", {"message": str(error)})
        except Exception as send_err:
            print(f"[{self.service_name}] Failed to send error to client: {send_err}")
            try:
                await self.websocket.close()
            except Exception as close_err:
                print(f"[{self.service_name}] Failed to close websocket: {close_err}")
            return True

        return False

    async def handle_incoming_message(self) -> None:
        """
        Handle incoming messages from the WebSocket connection.
        Accepts the connection and processes messages in a loop until disconnection.
        """
        await self.websocket.accept()
        print(f"[{self.service_name}] Client connected")

        while True:
            services = [self.service_name] # default services

            try:
                raw = await self.websocket.receive_text()
                msg, services = await self._parse_message(raw)

                if msg is None:
                    continue

                if self.service_name not in msg.services:
                    continue

                await self._route_message(msg)

            except Exception as e:
                should_close = await self._handle_error(e, services)
                if should_close:
                    break
