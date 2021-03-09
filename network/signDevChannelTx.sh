#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error.
set -e
set -o pipefail
#

echo "Requirement: Fabric containers need to be running"

# Mandatory parameter to configure all peers in the same Docker network
export COMPOSE_PROJECT_NAME="atlas"

# Variable holds path to the channel tx file
CHANNEL_TX_FILE=/etc/hyperledger/fabric/configtx/devchannel.tx

function channelSignconfigtx () {
    # Execute command to sign the tx file in Docker
    docker exec $PEER \
        peer channel signconfigtx -f ${CHANNEL_TX_FILE}

    echo "====> Done. Signed channel tx file with identity peer $PEER"
}


### -----------------------
echo "Switched to: Guarani" 

export PEER="peer0.guarani.blockchain.biz"
channelSignconfigtx

### -----------------------
echo "Switched to: Ticcuna" 

export PEER="peer0.ticcuna.blockchain.biz"
channelSignconfigtx

### -----------------------
echo "Switched to: Xavante" 

export PEER="peer0.xavante.blockchain.biz"
channelSignconfigtx

### -----------------------

figlet "Signed"

if [ "$?" -ne 0 ]; then
  echo "Failed to sign channel tx file."
  exit 1
fi

# END