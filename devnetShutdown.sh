#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

function stopDocker (){
  docker stop $IMAGE
  docker rm $IMAGE
}

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

echo "Stopping containers"
docker-compose -f ./docker-compose.yaml down --remove-orphans

export IMAGE=cliGuarani
stopDocker

export IMAGE=peer0.guarani.blockchain.biz
stopDocker

export IMAGE=couchdb.guarani.peer0
stopDocker

export IMAGE=cliTiccuna
stopDocker

export IMAGE=peer0.ticcuna.blockchain.biz
stopDocker

export IMAGE=couchdb.ticcuna.peer0
stopDocker

export IMAGE=orderer.blockchain.biz
stopDocker

docker rm --force $(docker ps -a --filter "name=blockdevnet")
docker container stop $(docker container ls -aq)
docker container rm $(docker container ls -aq)

echo "Remove the local state"
rm -f ~/.hfc-key-store/*

echo " ==> DevNet Down"

echo "List Docker containers"
docker ps -a

#END