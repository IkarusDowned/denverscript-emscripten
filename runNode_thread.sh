#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <num_processes>"
  exit 1
fi

NUM_PROCESSES=$1
PIDS=()

# Cleanup function on Ctrl+C
cleanup() {
  echo "Caught SIGINT. Terminating all writer and reader processes..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null
  done
  kill "$READER_PID" 2>/dev/null
  wait
  exit 0
}

trap cleanup SIGINT

# Start writer processes
for ((i=1; i<=NUM_PROCESSES; i++)); do
  node js/node/writer/fileWriter.mjs --file ./output/test${i}.dat --seed ${i} &
  PIDS+=($!)
done

# Sleep for 2 milliseconds
sleep 0.002

# Build the comma-separated list of files
FILES_ARG=""
for ((i=1; i<=NUM_PROCESSES; i++)); do
  FILES_ARG+="output/test${i}.dat,"
done
FILES_ARG=${FILES_ARG%,}

# Start the reader
node js/emscripten/reader/reader.mjs --files "$FILES_ARG" &
READER_PID=$!

# Wait for all processes
wait
