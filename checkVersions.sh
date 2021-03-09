#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

# set -v

echo "---"
echo "Python version:"
python --version


echo "---"
echo "Java Runtime version"
java -version


echo "---"
echo "Java Compiler version"
javac -version


echo "---"
echo "MVN version"
mvn -version


echo "---"
echo "GIT version"
git --version


echo "---"
echo "Go Language version"
go version


echo "---"
echo "Docker version"
docker -v


echo "---"
echo "Docker-Compose version"
docker-compose -v


echo "---"
echo "Node.js version"
node -v


echo "---"
echo "Node Package Manager (NPM) version"
npm -v


echo "---"
echo "Hyperledger Fabric Orderer version"
orderer version


echo "---"
echo "Hyperledger Fabric Peer version"
peer version


echo "---"
echo "Hyperledger Fabric Cryptogen version"
cryptogen version


echo "---"
echo "Hyperledger Fabric ConfigTxGen version"
configtxgen -version


echo "---"
echo "Hyperledger Fabric CA-Server version"
fabric-ca-server version


echo "---"
echo "Hyperledger Fabric CA-Client version"
fabric-ca-client version

# END