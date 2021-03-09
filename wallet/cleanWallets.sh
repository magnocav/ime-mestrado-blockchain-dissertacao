#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# set -v

echo "Removing wallets from Guarani"
sudo rm -R ./guarani/*

echo "Removing wallets from Ticcuna"
sudo rm -R ./ticcuna/*

echo "Removing wallets from Xavante"
sudo rm -R ./xavante/*

echo " ==> Wallets Removed!"

# END