#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <num_processes>"
  exit 1
fi

NUM_PROCESSES=$1
PIDS=()

# Function to clean up child processes on Ctrl+C
cleanup() {
  echo "Caught SIGINT. Stopping all processes..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null
  done
  wait
  exit 0
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT

# Start N processes
for ((i=1; i<=NUM_PROCESSES; i++)); do
  node js/node/writer/fileWriter.mjs --file ./output/test${i}.dat --seed ${i} &
  PIDS+=($!)
done

# Wait for all background jobs
wait
