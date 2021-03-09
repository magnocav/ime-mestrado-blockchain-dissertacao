#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# set -v

ORDERER="orderer.blockchain.biz"
PEER_GUARANI="peer0.guarani.blockchain.biz"
PEER_TICCUNA="peer0.ticcuna.blockchain.biz"
PEER_XAVANTE="peer0.xavante.blockchain.biz"

function connectionTest () {
    
    echo "Host: $HOST_NAME, and destination: $DESTINATION_STR"
    
    rm -f /etc/hyperledger/fabric/ledger/peer/wgetDoc.txt 

    docker exec $HOST_NAME bash -c "wget --tries=2 --server-response \
            --spider --connect-timeout=5 \
            --output-document=/etc/hyperledger/fabric/ledger/peer/wgetDoc.txt \
            $DESTINATION_STR"

    echo "-------------------"
}

#----------------
echo "Testing connections from Guarani"
echo " ==> Guarani conns"

HOST_NAME="cliGuarani"

DESTINATION_STR="$PEER_GUARANI:10051"
connectionTest

HOST_NAME="$PEER_GUARANI"

DESTINATION_STR="$ORDERER:7050"
connectionTest

DESTINATION_STR="$PEER_TICCUNA:12051"
connectionTest

DESTINATION_STR="$PEER_XAVANTE:14051"
connectionTest

sleep 2
#----------------
echo "Testing connections from Ticcuna"
echo " ==> Ticcuna conns"

HOST_NAME="cliTiccuna"

DESTINATION_STR="$PEER_TICCUNA:12051"
connectionTest

HOST_NAME="$PEER_TICCUNA"

DESTINATION_STR="$ORDERER:7050"
connectionTest

DESTINATION_STR="$PEER_GUARANI:10051"
connectionTest

DESTINATION_STR="$PEER_XAVANTE:14051"
connectionTest

sleep 2
#----------------
echo "Testing connections from Xavante"
echo " ==> Xavante conns"

HOST_NAME="cliXavante"

DESTINATION_STR="$PEER_XAVANTE:14051"
connectionTest

HOST_NAME="$PEER_XAVANTE"

DESTINATION_STR="$ORDERER:7050"
connectionTest

DESTINATION_STR="$PEER_GUARANI:10051"
connectionTest

DESTINATION_STR="$PEER_TICCUNA:12051"
connectionTest

echo "Testing END"

# END