#!/bin/sh

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
CLIENTPATH=$(readlink -f "$SCRIPTPATH/../shk-madgim-client")

# redirect port 80 to 3000
# sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000

forever start "$SCRIPTPATH/src/index.js" "$CLIENTPATH/src" 3000
forever start -t -c /bin/sh githook.sh