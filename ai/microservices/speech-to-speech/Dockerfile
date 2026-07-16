FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

WORKDIR /app
ENV PYTHONPATH=/app:$PYTHONPATH \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=5

RUN apt-get update && apt-get install -y \
    python3.11 python3.11-dev python3-pip git espeak-ng wget ffmpeg \
    libasound2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install -r requirements.txt

RUN mkdir -p /app/models/whisper && \
    python3 -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='Systran/faster-whisper-large-v3', local_dir='/app/models/whisper/faster-whisper-large-v3', local_dir_use_symlinks=False)"

RUN mkdir -p /app/models/piper && \
    wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx -O /app/models/piper/fr_FR-siwis-medium.onnx && \
    wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json -O /app/models/piper/fr_FR-siwis-medium.onnx.json

ENV WHISPER_MODEL_PATH=/app/models/whisper/faster-whisper-large-v3

COPY . /app

RUN chmod +x /app/entryPoint.sh
ENTRYPOINT ["/app/entryPoint.sh"]
