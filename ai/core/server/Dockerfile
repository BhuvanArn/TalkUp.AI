FROM debian:bullseye-slim AS builder

# Reduce apt failures on slow/unstable networks (mirrors, large metapackages).
RUN printf '%s\n' \
    'Acquire::Retries "5";' \
    'Acquire::http::Timeout "120";' \
    'Acquire::https::Timeout "120";' \
    > /etc/apt/apt.conf.d/80-retries

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    git \
    curl \
    wget \
    ca-certificates \
    libcurl4-openssl-dev \
    libssl-dev \
    libboost-system-dev \
    libboost-date-time-dev \
    libboost1.74-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN wget -q https://github.com/Kitware/CMake/releases/download/v3.31.6/cmake-3.31.6-linux-x86_64.tar.gz && \
    tar -xvzf cmake-3.31.6-linux-x86_64.tar.gz --strip-components=1 -C /usr/local && \
    rm cmake-3.31.6-linux-x86_64.tar.gz

WORKDIR /app
COPY . .

RUN rm -rf build && cmake -B build -S . && cmake --build build

FROM debian:bullseye-slim

RUN printf '%s\n' \
    'Acquire::Retries "5";' \
    'Acquire::http::Timeout "120";' \
    'Acquire::https::Timeout "120";' \
    > /etc/apt/apt.conf.d/80-retries

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4 \
    libssl1.1 \
    libboost-system1.74.0 \
    libboost-date-time1.74.0 \
    ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/build/talkup_ai_mic_server /app/talkup_ai_mic_server
COPY --from=builder /app/services.json /app/services.json

COPY --from=builder /app/.env /app/.env

CMD ["./talkup_ai_mic_server"]
