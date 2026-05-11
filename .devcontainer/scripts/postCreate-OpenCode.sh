#!/usr/bin/env bash

scriptdir="$(dirname "$0")"
echo $scriptdir
set -e
mkdir -p $HOME/.config/opencode/
cp $scriptdir/opencode.json $HOME/.config/opencode/
