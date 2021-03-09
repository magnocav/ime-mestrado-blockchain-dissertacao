#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0
#
set -v

# The Policy for App Channel Creation = ANY of Admins
# This utility leads to signing of the channel txn file by 3 organizations

function signChannelTxFile {
    echo "Peer Name: $PEER_NAME"
    
    docker exec -e "FABRIC_CFG_PATH=/etc/hyperledger/fabric/config/peer" \
        -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto/peer/msp" \
        -e "CORE_PEER_FILESYSTEMPATH=/etc/hyperledger/fabric/ledger/peer" \
        $PEER_NAME peer channel signconfigtx \
        -f /etc/hyperledger/fabric/configtx/syschannel.tx
}

# Sign the Channel Tx file as Guarani
export PEER_NAME=peer0.guarani.blockchain.biz
signChannelTxFile
echo "Signed the TX as Guarani"

# Sign the Channel Tx file as Ticcuna
export PEER_NAME=peer0.ticcuna.blockchain.biz
signChannelTxFile
echo "Signed the TX as Ticcuna"

# Sign the Channel Tx file as Xavante
export PEER_NAME=peer0.xavante.blockchain.biz
signChannelTxFile
echo "Signed the TX as Xavante"

# END