#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# Don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

echo "Launch Containers"
docker-compose -f ./docker-compose.yaml up -d

echo "Sleep 7 seconds"
sleep 7

echo "List Docker containers"
docker ps -a

# echo "----------------------"
# echo "Inspect docker network"
# docker network inspect atlas_blockdevnet

# END
