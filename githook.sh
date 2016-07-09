#!/bin/sh

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
CLIENTPATH=$(readlink -f "$SCRIPTPATH/../shk-madgim-client")

githooked -r refs/heads/master -p 9001 "git -C '$CLIENTPATH' pull && git pull && npm --prefix '$SCRIPTPATH/src' install && forever resta
rt '$SCRIPTPATH/src/index.js'"