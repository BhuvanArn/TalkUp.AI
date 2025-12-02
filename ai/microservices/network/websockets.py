##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This is the websockets.py of the microservices network.
##

import json
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

    async def handle_incoming_message(self) -> Message:
        """
        Handle an incoming message from the WebSocket connection.
        """
        await self.websocket.accept()
        print(f"[{self.service_name}] Client connected")

        while True:
            try:
                raw = await self.websocket.receive_text()
                try:
                    payload = json.loads(raw)
                except Exception as e:
                    await self.send(self.websocket, [self.service_name], "error", {"message": f"Invalid JSON: {str(e)}"})
                    continue

                if "data" not in payload:
                    payload["data"] = None

                try:
                    msg = Message(**payload)
                except Exception as e:
                    services = payload.get("services", [self.service_name])
                    await self.send(self.websocket, services, "error", {"message": f"Invalid Message payload: {str(e)}"})
                    continue
                if self.service_name not in msg.services:
                    continue
                if msg.type == "ping":
                    await self.send(self.websocket, msg.services, "pong", {"status": "active"})
                    continue
                if msg.type == "stream_chunk":
                    if self.owner and hasattr(self.owner, "on_stream_chunk"):
                        await self.owner.on_stream_chunk(self.websocket, msg)
                    else:
                        await self.on_stream_chunk(self.websocket, msg)
                    continue

                if msg.type == "process_request":
                    if self.owner and hasattr(self.owner, "on_process_request"):
                        await self.owner.on_process_request(self.websocket, msg)
                    else:
                        await self.on_process_request(self.websocket, msg)
                    continue

                await self.send(self.websocket, msg.services, "error",
                    {"message": f"Unknown message type: {msg.type}"})

            except Exception as e:
                services = getattr(locals().get('msg', None), 'services', [self.service_name])
                if isinstance(e, WebSocketDisconnect):
                    print(f"[{self.service_name}] Client disconnected (code={e.code})")
                    break

                try:
                    await self.send(self.websocket, services, "error", {"message": str(e)})
                except Exception as send_err:
                    print(f"[{self.service_name}] Failed to send error to client: {send_err}")
                    try:
                        await self.websocket.close()
                    except Exception:
                        pass
                break
