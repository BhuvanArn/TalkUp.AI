#!/bin/sh

: "${STS_HOST:=0.0.0.0}"
: "${STS_PORT:=8002}"
exec python3 -m uvicorn main:app --host "$STS_HOST" --port "$STS_PORT"
