#!/bin/sh
set -eu

EXIT_NIX_MISSING=3
EXIT_FILE_MISSING=4
EXIT_VALE_UNAVAILABLE=5
USAGE="usage: lint.sh <model|human> <file>..."

fail() {
  echo "instructions lint: $2" >&2
  exit "$1"
}

require_kind() {
  [ "$#" -gt 0 ] && [ -f "$SHARED_DIR/vale/$1.ini" ] || fail "$EXIT_FILE_MISSING" "$USAGE"
}

require_files() {
  [ "$#" -gt 0 ] || fail "$EXIT_FILE_MISSING" "$USAGE"
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

SHARED_DIR=$(cd "$(script_dir)" && pwd -P)
PLUGIN_ROOT=$(cd "$SHARED_DIR/.." && pwd -P)

require_kind "$@"
KIND=$1
shift
require_files "$@"
require_nix
VALE_STORE_PATH=$(build_pinned_vale)

exec "$VALE_STORE_PATH/bin/vale" --no-global \
  --config="$SHARED_DIR/vale/$KIND.ini" \
  --output="$SHARED_DIR/vale/alerts.tmpl" \
  "$@"
