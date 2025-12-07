#!/bin/sh

: "${STT_HOST:=0.0.0.0}"
: "${STT_PORT:=8002}"
exec python -m uvicorn main:app --host "$STT_HOST" --port "$STT_PORT"
