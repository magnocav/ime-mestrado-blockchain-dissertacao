#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#
# docker exec -it cliGuarani bash

# Check peer version
#--------------------------------------------------------------------------------
peer version

# Configure Env vars
#--------------------------------------------------------------------------------
CHANNELNAME="devchannel"
CHANNELFOLDER="/etc/hyperledger/fabric/guarani/peer/ledger"
CHANNELBLOCKGEN="${CHANNELFOLDER}/devchannelgen.block"
ORDERERNAME="orderer.blockchain.biz:7050"
CONFIGTXFOLDER="/etc/hyperledger/fabric/configtx"

# List of channels peer has joined
#--------------------------------------------------------------------------------
peer channel list

# Create a channel 
# The result is a block file named $CHANNELNAME.block. 
# And we have to use this $CHANNELNAME.block as parameter to execute peer channel join
#--------------------------------------------------------------------------------
peer channel create -o $ORDERERNAME -c $CHANNELNAME -f $CONFIGTXFOLDER/devchanneltrack.tx \
    --outputBlock $CHANNELBLOCKGEN --tls --cafile=$ORDERER_TLSCACERT

# Joins the Guarani peer to channel
# Reference: https://medium.com/@kctheservant/transactions-in-hyperledger-fabric-50e068dda8a9
#--------------------------------------------------------------------------------
peer channel join -o $ORDERERNAME -b $CHANNELBLOCKGEN --tls --cafile=$ORDERER_TLSCACERT

# Get information of a specified channel.
#--------------------------------------------------------------------------------
peer channel getinfo -o $ORDERERNAME -c $CHANNELNAME --tls --cafile=$ADMIN_PEER_TLSCACERT

# List of channels peer has joined
#--------------------------------------------------------------------------------
peer channel list

#




#--------------------------------------------------------------------------------
# Not run in a channel with chaincodes
# Update channel with anchor peer from Org
#
# The following commands are channel updates and they will propagate to the definition of the channel.
# In essence, we adding additional configuration information on top of the channel’s genesis block. 
# Note that we are not modifying the genesis block, but simply adding deltas into the chain that will 
# define the anchor peers.
#--------------------------------------------------------------------------------
peer channel update -o $ORDERERNAME -c $CHANNELNAME \
    -f $CONFIGTXFOLDER/$CHANNELNAME-GuaraniAnchor.tx --tls --cafile=$ORDERER_TLSCACERT

# Fetch a genesis block, writing it to a file.
#--------------------------------------------------------------------------------
  peer channel fetch oldest $CHANNELFOLDER/$CHANNELNAME_oldest.block -o $ORDERERNAME \
    -c $CHANNELNAME --tls --cafile $ORDERER_TLSCACERT
    
# Sign the channel TX file
#--------------------------------------------------------------------------------
docker exec cliGuarani \
    peer channel signconfigtx -f $CONFIGTXFOLDER/devchannel.tx

# END
