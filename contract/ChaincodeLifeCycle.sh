#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# Chaincode for Test related properties
# https://hyperledger-fabric.readthedocs.io/en/release-1.4/build_network.html
#
# Configure Env vars
#--------------------------------------------------------------------------------
CHANNELNAME="devchannel"
ORDERERNAME="orderer.blockchain.biz:7050"
CHCODEVERSION="1.0.0"
CHCODENAME="notarizecontract"
CHCODEPATH="/etc/hyperledger/src/chaincode"
CHPACKAGE="/etc/hyperledger/fabric/network/channel/notarizecontract100pkg.out"
CHPACKAGESIGNED="/etc/hyperledger/fabric/network/channel/signed-notarizecontract100pkg.out"

#--------------------------------------------------------------------------------
# Prepare chaincode package to install
#--------------------------------------------------------------------------------
peer chaincode package -n $CHCODENAME -p $CHCODEPATH -v $CHCODEVERSION -l node -s -S $CHPACKAGE

#--------------------------------------------------------------------------------
# Sign chaincode package to install 
#--------------------------------------------------------------------------------
peer chaincode signpackage $CHPACKAGE $CHPACKAGESIGNED

# Install chaincode from package without signature
#--------------------------------------------------------------------------------
# peer chaincode install $CHPACKAGE -l node

# Install chaincode from signed package
#--------------------------------------------------------------------------------
peer chaincode install $CHPACKAGESIGNED -l node

# List installed chaincodes 
#--------------------------------------------------------------------------------
peer chaincode list --installed -C $CHANNELNAME

#--------------------------------------------------------------------------------
# Get information of a specified channel.
#--------------------------------------------------------------------------------
peer channel getinfo -o $ORDERERNAME -c $CHANNELNAME --tls --cafile=$ADMIN_PEER_TLSCACERT

#




# Instantiate chaincode 
# https://hyperledger-fabric.readthedocs.io/en/release-1.4/endorsement-policies.html
#--------------------------------------------------------------------------------
peer chaincode instantiate -C $CHANNELNAME -n $CHCODENAME -v $CHCODEVERSION -o $ORDERERNAME \
    -c '{"Args":["ContractNotarizeDocument:instantiate"]}' \
    -P "OR('OrdererMSP.admin','GuaraniMSP.admin','GuaraniMSP.peer','GuaraniMSP.member','TiccunaMSP.admin','TiccunaMSP.peer','TiccunaMSP.member','XavanteMSP.admin','XavanteMSP.peer','XavanteMSP.member')" \
    --tls --cafile $ORDERER_TLSCACERT --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE

#--------------------------------------------------------------------------------
# Waiting Sleep 7 seconds
#--------------------------------------------------------------------------------
sleep 7
#
# List instantiated chaincodes 
#--------------------------------------------------------------------------------
peer chaincode list --instantiated -C $CHANNELNAME
#
# Get information of a specified channel.
#--------------------------------------------------------------------------------
peer channel getinfo -o $ORDERERNAME -c $CHANNELNAME --tls --cafile=$ADMIN_PEER_TLSCACERT
#




#--------------------------------------------------------------------------------
# Invoke chaincode 
#--------------------------------------------------------------------------------
peer chaincode invoke -C $CHANNELNAME -n $CHCODENAME -o $ORDERERNAME \
    -c '{"Args":["ContractNotarizeDocument:instantiate"]}' \
    --tls --cafile $ORDERER_TLSCACERT --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE

#--------------------------------------------------------------------------------
# Waiting Sleep 7 seconds
#--------------------------------------------------------------------------------
sleep 7
#
# List instantiated chaincodes 
#--------------------------------------------------------------------------------
peer chaincode list --instantiated -C $CHANNELNAME
#
# Get information of a specified channel.
#--------------------------------------------------------------------------------
peer channel getinfo -o $ORDERERNAME -c $CHANNELNAME --tls --cafile=$ADMIN_PEER_TLSCACERT
#



# Upgrade chaincode from package
#--------------------------------------------------------------------------------
# peer chaincode upgrade -C $CHCODENAME /etc/hyperledger/fabric/network/channel/notarizecontract101pkg.out -l node


# END