#!/bin/sh
case $0 in
  */*) SCRIPT_DIR=${0%/*} ;;
  *) SCRIPT_DIR=. ;;
esac
exec "$SCRIPT_DIR/../../../shared/lint.sh" model "$@"
