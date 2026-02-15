#!/bin/bash
# Script to build Docker image with current timestamp

# Generate current timestamp in ISO format
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "Building Docker image with BUILD_TIMESTAMP=${BUILD_TIMESTAMP}"

# Build the Docker image with the timestamp as a build argument
docker build --build-arg BUILD_TIMESTAMP="${BUILD_TIMESTAMP}" -t agent-verse-app .

echo "Build completed with timestamp: ${BUILD_TIMESTAMP}"
