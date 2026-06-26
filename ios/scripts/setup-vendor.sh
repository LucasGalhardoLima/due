#!/usr/bin/env bash
# One-time setup: clones LocalLLMClient with submodules into ios/Vendor/.
# We can't consume it from the upstream URL via SPM because it uses
# symlinks into a git submodule (exclude/llama.cpp) that SPM does not
# recurse when fetching from a remote — see upstream issue #94.
#
# Idempotent: if Vendor/LocalLLMClient is already present, just updates.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$ROOT/Vendor/LocalLLMClient"
TAG="0.5.0"

if [ -d "$VENDOR_DIR" ]; then
  echo "↪ Vendor/LocalLLMClient already exists. Updating submodules."
  cd "$VENDOR_DIR"
  git fetch --tags
  git checkout "$TAG"
  git submodule update --init --recursive
else
  echo "↪ Cloning LocalLLMClient @ $TAG with submodules → $VENDOR_DIR"
  git clone --branch "$TAG" --recurse-submodules --depth 1 \
    https://github.com/tattn/LocalLLMClient.git "$VENDOR_DIR"
fi

echo "✓ Done. Now run: cd ios/Due && xcodegen generate"
