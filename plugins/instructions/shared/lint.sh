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

prepare_copies() {
  count=0
  for file in "$@"; do
    case $file in
      *.md | *.markdown)
        count=$((count + 1))
        awk -v work_dir="$WORK_DIR" -v id="$count" -v source="$file" -v kind="$KIND" \
          -v map="$WORK_DIR/map.$count" -f "$SHARED_DIR/prepare.awk" "$file"
        cat "$WORK_DIR/map.$count" >>"$WORK_DIR/map"
        ;;
      *) printf '%s\t%s\t0\t0\n' "$file" "$file" >>"$WORK_DIR/map" ;;
    esac
  done
}

run_vale_on_copies() {
  set --
  while IFS="$TAB" read -r copy _; do
    set -- "$@" "$copy"
  done <"$WORK_DIR/map"
  set +e
  "$VALE_STORE_PATH/bin/vale" --no-global \
    --config="$SHARED_DIR/vale/$KIND.ini" \
    --output="$SHARED_DIR/vale/alerts.tmpl" \
    "$@" >"$WORK_DIR/alerts" 2>"$WORK_DIR/errors"
  vale_status=$?
  set -e
  awk -f "$SHARED_DIR/remap.awk" "$WORK_DIR/map" "$WORK_DIR/alerts" | sort -s -t: -k1,1 -k2,2n -k3,3n
  awk -f "$SHARED_DIR/remap.awk" "$WORK_DIR/map" "$WORK_DIR/errors" >&2
  return "$vale_status"
}

SHARED_DIR=$(cd "$(script_dir)" && pwd -P)
PLUGIN_ROOT=$(cd "$SHARED_DIR/.." && pwd -P)
TAB=$(printf '\t')

require_kind "$@"
KIND=$1
shift
require_files "$@"
require_nix
VALE_STORE_PATH=$(build_pinned_vale)

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
: >"$WORK_DIR/map"
prepare_copies "$@"
run_vale_on_copies
