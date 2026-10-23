#!/bin/sh
set -eu

EXIT_NIX_MISSING=3
EXIT_FILE_MISSING=4
EXIT_VALE_UNAVAILABLE=5

fail() {
  echo "writing-instructions lint: $2" >&2
  exit "$1"
}

require_files() {
  [ "$#" -gt 0 ] || fail "$EXIT_FILE_MISSING" "usage: lint.sh <file>..."
  for file in "$@"; do
    [ -f "$file" ] || fail "$EXIT_FILE_MISSING" "no such file: $file"
  done
}

require_nix() {
  command -v nix >/dev/null 2>&1 || fail "$EXIT_NIX_MISSING" "nix is not installed, see https://nixos.org/download"
}

script_dir() {
  case $0 in
    */*) echo "${0%/*}" ;;
    *) echo . ;;
  esac
}

build_pinned_vale() {
  nix --extra-experimental-features 'nix-command flakes' --option warn-dirty false \
    build --out-link "$PLUGIN_ROOT/.vale-gcroot" --print-out-paths --quiet "$PLUGIN_ROOT#vale" ||
    fail "$EXIT_VALE_UNAVAILABLE" "nix could not build the pinned Vale from $PLUGIN_ROOT/flake.nix"
}

SKILL_DIR=$(cd "$(script_dir)/.." && pwd -P)
PLUGIN_ROOT=$(cd "$SKILL_DIR/../.." && pwd -P)

require_files "$@"
require_nix
VALE_STORE_PATH=$(build_pinned_vale)

exec "$VALE_STORE_PATH/bin/vale" --no-global \
  --config="$SKILL_DIR/vale/.vale.ini" \
  --output="$SKILL_DIR/vale/alerts.tmpl" \
  "$@"
