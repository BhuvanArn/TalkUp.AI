FROM python:3.10-slim
WORKDIR /app
ENV PYTHONPATH=/app:$PYTHONPATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends libportaudio2 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install deps and vosk before copying the app to leverage Docker layer caching
COPY microservices/speech-to-text/requirements.txt /tmp/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip pip install -r /tmp/requirements.txt
RUN python -c "from vosk import Model; Model(lang='fr')" && \
    echo "Vosk model downloaded successfully"

COPY microservices/speech-to-text /app
COPY microservices/network /app/network

ENV VOSK_MODEL_PATH=/root/.cache/vosk
ENV VOSK_MODEL_LANG=fr

RUN chmod +x /app/entryPoint.sh
ENTRYPOINT ["/app/entryPoint.sh"]
