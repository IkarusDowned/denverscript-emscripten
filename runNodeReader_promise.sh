#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <num_files>"
  exit 1
fi

NUM_FILES=$1

# Build the comma-separated list of files
FILES_ARG=""
for ((i=1; i<=NUM_FILES; i++)); do
  FILES_ARG+="output/test${i}.dat,"
done
FILES_ARG=${FILES_ARG%,}  # Remove trailing comma

# Function to clean up on Ctrl+C
cleanup() {
  echo "Caught SIGINT. Terminating reader process..."
  kill "$READER_PID" 2>/dev/null
  wait "$READER_PID"
  exit 0
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT

# Run the command
node js/node/reader/reader.mjs --files "$FILES_ARG" &
READER_PID=$!

# Wait for the process to complete
wait "$READER_PID"
