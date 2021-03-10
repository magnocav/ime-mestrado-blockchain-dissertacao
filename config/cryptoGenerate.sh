#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

echo "Remove previous crypto material and configurations"
sudo rm -rf ./../crypto-config/*Organizations

echo "Generating crypto-material for organizations"
cryptogen generate --config=./crypto-config.yaml --output=./../crypto-config

echo " ==> Crypto-Config OK"

# END