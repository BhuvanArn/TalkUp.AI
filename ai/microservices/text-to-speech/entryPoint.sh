#!/bin/sh

: "${TTS_HOST:=0.0.0.0}"
: "${TTS_PORT:=8005}"
exec python -m uvicorn main:app --host "$TTS_HOST" --port "$TTS_PORT"
