#!/bin/bash

# A simple script to fetch recent map server script errors from Docker
# Assumes the map server container is named 'rathena-map' or similar.

CONTAINER_NAME=${1:-rathena-map}
LINES_TO_TAIL=${2:-500}

echo "Fetching last $LINES_TO_TAIL lines from container: $CONTAINER_NAME"
echo "Filtering for [Error] and [Warning] related to scripts..."
echo "--------------------------------------------------------"

# Use docker logs and grep for common script error identifiers
docker logs --tail "$LINES_TO_TAIL" "$CONTAINER_NAME" 2>&1 | grep -iE '\[Error\]|\[Warning\]' | grep -iE 'script|buildin|parse_script|npc'

echo "--------------------------------------------------------"
echo "Done."