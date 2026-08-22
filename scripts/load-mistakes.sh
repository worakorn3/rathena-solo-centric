#!/usr/bin/env sh
# POSIX shell context loader for Linux / macOS / *nix
# Reads distilled HOT mistakes and action items into agent context (< 350 tokens)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOT_PATH="${SCRIPT_DIR}/../MISTAKES_AND_LEARNINGS.md"

if [ -f "${HOT_PATH}" ]; then
  cat "${HOT_PATH}"
fi
