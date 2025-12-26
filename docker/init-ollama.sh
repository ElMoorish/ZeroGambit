#!/bin/bash

# Ollama initialization script - pulls Gemma model on first run

echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
sleep 5

# Check if Gemma is already pulled
if ollama list | grep -q "gemma:2b"; then
    echo "✓ Gemma 2B already available"
else
    echo "Pulling Gemma 2B model (1.7GB)..."
    ollama pull gemma:2b
    echo "✓ Gemma 2B downloaded"
fi

# Keep Ollama running
wait $OLLAMA_PID
