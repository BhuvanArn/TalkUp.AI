##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## This is the main.py of the text-to-speech microservice.
##

import os
import sys
import threading
import uvicorn

from fastapi import FastAPI, WebSocket

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.ttsServices import TTS

app = FastAPI()


@app.websocket("/ws/tts")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket entry for the TTS microservice.

    Incoming payload expected from C++ server:
    {
      "services": ["TTS"],
      "type": "stream_chunk",
      "timestamp": 123,
      "data": {"chunk": "text to synthesize", "eof": true}
    }
    """
    tts = TTS(websocket)
    thread = threading.Thread(target=tts.start_tts_process, daemon=True)
    thread.start()

    try:
        await tts.TTSWsMicroservice.handle_incoming_message()
    finally:
        tts.stop_tts_process()

def main() -> bool:
    with open("text-sample/sample-start-interview.txt", "r", encoding="utf-8") as f:
        text = f.read()
    print(f"Loaded sample text ({len(text)} chars). Start with uvicorn for websocket mode.")
    return True

if __name__ == "__main__":
    main()
