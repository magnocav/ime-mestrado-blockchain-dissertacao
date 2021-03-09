#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# set -v

echo "Removing chaincode from PEER Guarani"
sudo rm ./guarani/workdir/chaincodes/notarizecontract.*

echo "Removing chaincode package"
sudo rm ./network/channel/notarize*pkg.out

echo "Docker remove images with \"blockdevnet-*notarize*\"  :"
# Remove docker images with blockdevnet- prefix
docker rmi --force $(docker images "blockdevnet-*notarizecontract-*" -q)

echo " ==> Chaincode Removed!"

# END