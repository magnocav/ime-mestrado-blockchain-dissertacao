#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# Check peer version
#--------------------------------------------------------------------------------
peer version

# Configure Env vars
#--------------------------------------------------------------------------------
CHANNELNAME="devchannel"
CHANNELFOLDER="/etc/hyperledger/fabric/ticcuna/peer/ledger"
CHANNELBLOCKGEN="${CHANNELFOLDER}/devchannelgen.block"
ORDERERNAME="orderer.blockchain.biz:7050"
CONFIGTXFOLDER="/etc/hyperledger/fabric/configtx"

# List of channels peer has joined
#--------------------------------------------------------------------------------
peer channel list

# Fetch a genesis block, writing it to a file.
#--------------------------------------------------------------------------------
peer channel fetch oldest $CHANNELFOLDER/${CHANNELNAME}_oldest.block \
    -o $ORDERERNAME -c $CHANNELNAME --tls --cafile $ORDERER_TLSCACERT

# List oldest.block file in filesystem
#--------------------------------------------------------------------------------
ls $CHANNELFOLDER

# Joins the Ticcuna peer to channel, using genesis/oldest block
#--------------------------------------------------------------------------------
peer channel join -o $ORDERERNAME -b $CHANNELFOLDER/${CHANNELNAME}_oldest.block \
  --tls --cafile=$ORDERER_TLSCACERT

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
#--------------------------------------------------------------------------------
peer channel update -o $ORDERERNAME -c $CHANNELNAME \
    -f $CONFIGTXFOLDER/$CHANNELNAME-XavanteAnchor.tx

# END