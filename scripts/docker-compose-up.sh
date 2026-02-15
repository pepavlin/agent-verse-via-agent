#!/bin/bash
# Script to run docker-compose with current timestamp

# Generate current timestamp in ISO format
export BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "Starting docker-compose with BUILD_TIMESTAMP=${BUILD_TIMESTAMP}"

# Run docker-compose with the timestamp
docker-compose up --build "$@"
