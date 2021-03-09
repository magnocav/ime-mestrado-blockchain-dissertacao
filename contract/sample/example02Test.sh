#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# Chaincode for Test related properties
# https://hyperledger-fabric.readthedocs.io/en/release-1.4/build_network.html

CHANNELNAME="devchannel"
ORDERERNAME="orderer.blockchain.biz:7050"
CHCODEVERSION="1.0.0"
CHCODENAME="example02"
CHCODEPATH="/etc/hyperledger/src/chaincode/sample"

#--------------------------------------------------------------------------------
# Prepare chaincode pachage to install
#--------------------------------------------------------------------------------
peer chaincode package -n $CHCODENAME -p $CHCODEPATH -v $CHCODEVERSION -l node \
    -s -S /etc/hyperledger/fabric/network/channel/example02package.out

# Install chaincode from package
#--------------------------------------------------------------------------------
peer chaincode install /etc/hyperledger/fabric/network/channel/example02package.out -l node


# Install chaincode from direct file
#--------------------------------------------------------------------------------
peer chaincode install -n $CHCODENAME -p $CHCODEPATH -v $CHCODEVERSION -l node \
    --tls --cafile $ADMIN_PEER_TLSCACERT


# List installed chaincodes 
#--------------------------------------------------------------------------------
peer chaincode list --installed -C $CHANNELNAME


# Instantiate chaincode 
# https://hyperledger-fabric.readthedocs.io/en/release-1.4/endorsement-policies.html
#--------------------------------------------------------------------------------
peer chaincode instantiate -C $CHANNELNAME -n $CHCODENAME -v $CHCODEVERSION \
    -o $ORDERERNAME \
    -c '{"Args":["init","a","150","b","350"]}' \
    -P "OR('OrdererMSP.admin','GuaraniMSP.admin','GuaraniMSP.peer','GuaraniMSP.member','TiccunaMSP.admin','TiccunaMSP.peer','TiccunaMSP.member')" \
    --tls --cafile $ORDERER_TLSCACERT --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE


# List instantiated chaincodes 
#--------------------------------------------------------------------------------
peer chaincode list --instantiated -C $CHANNELNAME


# Query chaincodes 
#--------------------------------------------------------------------------------
echo -n "query A = "

peer chaincode query -C $CHANNELNAME -n $CHCODENAME  -c '{"Args":["query","a"]}'

#--------------------------------------------------------------------------------
echo -n "query B = "

peer chaincode query -C $CHANNELNAME -n $CHCODENAME  -c '{"Args":["query","b"]}'


# Invoke instantiated chaincode 
#--------------------------------------------------------------------------------
echo "Invoke sending 20 token from a -> b"

peer chaincode invoke -o $ORDERERNAME -C $CHANNELNAME -n $CHCODENAME  \
    -c '{"Args":["invoke","a","b","20"]}' \
    --tls --cafile $ORDERER_TLSCACERT \
    --peerAddresses peer0.guarani.blockchain.biz:10051 \
    --tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE

