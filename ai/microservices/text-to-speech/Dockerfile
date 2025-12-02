FROM python:3.10-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	   build-essential \
	   pkg-config \
	   libasound2-dev \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
