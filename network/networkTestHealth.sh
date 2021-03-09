#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# set -v

ORDERER="orderer.blockchain.biz:7070/healthz"
PEER_GUARANI="peer0.guarani.blockchain.biz:10054/healthz"
PEER_TICCUNA="peer0.ticcuna.blockchain.biz:12054/healthz"
PEER_XAVANTE="peer0.xavante.blockchain.biz:14054/healthz"

HOST_NAME=$ORDERER

function connectionTest () {
    
    echo "Host: $HOST_NAME"
    
    curl $HOST_NAME
    
    echo " "
    echo "-------------------"
}

HOST_NAME=$ORDERER
connectionTest

HOST_NAME=$PEER_GUARANI
connectionTest

HOST_NAME=$PEER_TICCUNA
connectionTest

HOST_NAME=$PEER_XAVANTE
connectionTest

echo "Testing END"

# END