#!/usr/bin/env bash
# Pulls 4 small chat models (GGUF, Q4_K_M) into the iOS bundle so we can
# A/B them on-device. Total bundle cost: ~2.3 GB.
#
# Usage:
#   ./scripts/fetch-model.sh             # all 4
#   ./scripts/fetch-model.sh qwen3_06b   # just one (id from LocalModelCatalog)
#
# Requires: huggingface_hub  →  brew install huggingface-cli  (then `hf auth login` if private)

set -euo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/Du/Du/Resources/Models"
# Note: project root for the iOS app is `ios/Due/`; the Swift target is named "Due".
# If your folder still says `Due/Due/...`, fall back below.
if [ ! -d "$(dirname "$DEST")" ]; then
  DEST="$(cd "$(dirname "$0")/.." && pwd)/Due/Due/Resources/Models"
fi

mkdir -p "$DEST"

# id : huggingface_repo : gguf_filename_glob : output_filename
MODELS=(
  "qwen3_06b   |unsloth/Qwen3-0.6B-GGUF                |Qwen3-0.6B-Q4_K_M.gguf            |qwen3-0.6b-q4_k_m.gguf"
  "qwen35_08b  |unsloth/Qwen3-1.7B-GGUF                |Qwen3-1.7B-Q4_K_M.gguf            |qwen3.5-0.8b-q4_k_m.gguf"
  "gemma3_1b   |unsloth/gemma-3-1b-it-GGUF             |gemma-3-1b-it-Q4_K_M.gguf         |gemma3-1b-q4_k_m.gguf"
  "llama32_1b  |bartowski/Llama-3.2-1B-Instruct-GGUF   |Llama-3.2-1B-Instruct-Q4_K_M.gguf |llama3.2-1b-q4_k_m.gguf"
)

# NOTE on `qwen35_08b`: at time of writing, "Qwen 3.5" GGUFs are not yet
# released by the official Qwen team. We substitute Qwen 3 1.7B Q4_K_M as
# the closest comparable in the same size band (~1 GB). Update the entry
# above when the real Qwen 3.5 0.8B-GGUF lands.

WANTED="${1:-all}"

fetch_one() {
  local id="$1" repo="$2" glob="$3" out="$4"
  local target="$DEST/$out"

  if [ -f "$target" ]; then
    echo "✓ $id already present ($(du -h "$target" | cut -f1)) — skipping"
    return
  fi

  echo "↪ Fetching $id  ($repo / $glob)"
  local tmpdir
  tmpdir=$(mktemp -d)

  if command -v hf >/dev/null 2>&1; then
    hf download "$repo" --include "$glob" --local-dir "$tmpdir"
  elif command -v huggingface-cli >/dev/null 2>&1; then
    huggingface-cli download "$repo" --include "$glob" --local-dir "$tmpdir" --local-dir-use-symlinks False
  else
    echo "❌ Install huggingface_hub first:  brew install huggingface-cli"
    exit 1
  fi

  local found
  found=$(find "$tmpdir" -name "$glob" | head -n1)
  if [ -z "$found" ]; then
    echo "❌ $id: $glob not found in $repo. Check the filename or update fetch-model.sh."
    rm -rf "$tmpdir"
    exit 1
  fi
  mv "$found" "$target"
  rm -rf "$tmpdir"
  echo "✓ $id → $out  ($(du -h "$target" | cut -f1))"
}

for entry in "${MODELS[@]}"; do
  IFS='|' read -r id repo glob out <<<"$(echo "$entry" | tr -d ' ')"
  if [ "$WANTED" = "all" ] || [ "$WANTED" = "$id" ]; then
    fetch_one "$id" "$repo" "$glob" "$out"
  fi
done

echo
echo "✓ Done. Bundle total:"
du -sh "$DEST"
echo
echo "Re-run xcodegen so the new files end up in the build:"
echo "  cd ios/Due && xcodegen generate"
