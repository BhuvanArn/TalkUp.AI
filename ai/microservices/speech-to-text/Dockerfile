FROM python:3.10-slim
WORKDIR /app
ENV PYTHONPATH=/app:$PYTHONPATH
RUN apt-get update && apt-get install -y libportaudio2 ffmpeg

COPY microservices/speech-to-text /app
COPY microservices/network /app/network

RUN pip install -r requirements.txt

RUN python -c "from vosk import Model; Model(lang='fr')" && \
    echo "Vosk model downloaded successfully"
ENV VOSK_MODEL_PATH=/root/.cache/vosk
ENV VOSK_MODEL_LANG=fr

RUN chmod +x /app/entryPoint.sh
ENTRYPOINT ["/app/entryPoint.sh"]
