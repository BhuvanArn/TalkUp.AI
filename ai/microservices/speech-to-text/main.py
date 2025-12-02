##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This is the main.py of the speech-to-text microservice.
##

from fastapi import FastAPI, WebSocket
import threading

from engine.sttServices import STT

app = FastAPI()


@app.websocket("/ws/stt")
async def websocket_endpoint(websocket: WebSocket):
        """WebSocket entry for the STT microservice.

        Flow:
        - Instantiate STT with the live `websocket` connection.
        - Start the blocking `start_stt_process` in a background thread so the
            event loop stays responsive.
        - Delegate incoming message handling to the microservice's
            `WebSocketMicroservice.handle_incoming_message()` implementation.
        - Ensure `stop_stt_process()` is called on disconnect to clean up.
        """
        stt = STT("fr", websocket)

        thread = threading.Thread(target=stt.start_stt_process, daemon=True)
        thread.start()
        try:
                await stt.STTWsMicroservice.handle_incoming_message()
        finally:
                stt.stop_stt_process()
