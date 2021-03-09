#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# set -v

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

echo "Removing ledgers..."

LOCALATUAL=$PWD

function removeLedger () {
  sudo rm -rf ./chains
  sudo rm -rf ./chaincodes
  sudo rm -rf ./ledgersData
  sudo rm -rf ./index
  sudo rm -rf ./transientStore
  sudo rm -f *.block

  echo "Directory: ${PWD}"
}

cd $LOCALATUAL/orderer/workdir
removeLedger
cd $LOCALATUAL/orderer/workdir/ledger
removeLedger
rm -f $LOCALATUAL/orderer/workdir/*.block
echo "Orderer ledger directory removed"
echo "" 

cd $LOCALATUAL/guarani/workdir
removeLedger
cd $LOCALATUAL/guarani/workdir/ledger
removeLedger
rm -f $LOCALATUAL/guarani/workdir/*.block
echo "Peer GUARANI ledger directory removed"
echo "" 

cd $LOCALATUAL/ticcuna/workdir
removeLedger
cd $LOCALATUAL/ticcuna/workdir/ledger
removeLedger
rm -f $LOCALATUAL/ticcuna/workdir/*.block
echo "Peer TICCUNA ledger directory removed"
echo "" 

cd $LOCALATUAL/xavante/workdir
removeLedger
cd $LOCALATUAL/xavante/workdir/ledger
removeLedger
rm -f $LOCALATUAL/xavante/workdir/*.block
echo "Peer XAVANTE ledger directory removed"
echo "" 

cd $LOCALATUAL/network/channel
rm -rf ./*.json
rm -rf ./*.pb
rm -rf ./*.block
rm -rf ./*.out

echo "Docker list of images starting with blockdevnet-  :"
docker images "blockdevnet-*" -q

echo ""
echo "Docker remove images starting with blockdevnet-  :"
# Remove docker images with blockdevnet- prefix
docker rmi --force $(docker images "blockdevnet-*" -q)

echo " ==> Network channel metadata removed"

# END