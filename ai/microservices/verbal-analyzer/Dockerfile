FROM python:3.10-slim
WORKDIR /app

COPY requirements.txt ./requirements.txt

# Install dependencies with caching if no changes to requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY . .
CMD ["python", "main.py"]
