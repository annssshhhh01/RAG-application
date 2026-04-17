#!/bin/bash
cd /home/ubuntu/RAG-application/backend
source /home/ubuntu/RAG-application/venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
