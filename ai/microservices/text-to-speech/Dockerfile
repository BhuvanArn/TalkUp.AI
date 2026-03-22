FROM python:3.10-slim
WORKDIR /app
ENV PYTHONPATH=/app:$PYTHONPATH

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	   build-essential \
	   pkg-config \
	   libasound2-dev \
	&& rm -rf /var/lib/apt/lists/*

COPY microservices/text-to-speech /app
COPY microservices/network /app/network

RUN --mount=type=cache,target=/root/.cache/pip pip install torch torchaudio
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

RUN chmod +x /app/entryPoint.sh
ENTRYPOINT ["/app/entryPoint.sh"]
