FROM python:3.10-slim
WORKDIR /app
ENV PYTHONPATH=/app:$PYTHONPATH
RUN apt-get update && apt-get install -y libportaudio2 ffmpeg

COPY microservices/speech-to-text /app
COPY microservices/network /app/network

RUN pip install -r requirements.txt
#RUN chmod +x setup_stt.sh #Currently not needed, but can be used if you have the language model folder
RUN chmod +x /app/entryPoint.sh
ENTRYPOINT ["/app/entryPoint.sh"]
