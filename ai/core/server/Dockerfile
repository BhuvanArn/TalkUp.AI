FROM debian:bullseye-slim AS builder

RUN apt-get update && apt-get install -y \
    g++ cmake git curl libcurl4-openssl-dev wget libboost-all-dev libssl-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN wget https://github.com/Kitware/CMake/releases/download/v3.31.6/cmake-3.31.6-linux-x86_64.tar.gz && \
    tar -xvzf cmake-3.31.6-linux-x86_64.tar.gz --strip-components=1 -C /usr/local && \
    rm cmake-3.31.6-linux-x86_64.tar.gz

WORKDIR /app
COPY . .

RUN rm -rf build && cmake -B build -S . && cmake --build build

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev libssl-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/build/talkup_ai_mic_server /app/talkup_ai_mic_server
COPY --from=builder /app/services.json /app/services.json

CMD ["./talkup_ai_mic_server"]