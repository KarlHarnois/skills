#!/bin/sh
exec "${0%/*}/../../../shared/lint.sh" model "$@"
