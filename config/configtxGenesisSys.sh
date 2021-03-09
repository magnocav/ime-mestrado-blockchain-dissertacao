#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

PROFILEGENESIS=MultiOrgMSPSolo
PROFILECHANNEL=MultiOrgMSPChannel
CHANNELNAME=syschannel

rm -f ./../configtx/sys*.block
rm -f ./../configtx/$CHANNELNAME.tx
rm -f ./../configtx/$CHANNELNAME-*Anchor.tx 

echo "Generate genesis block for system running on Orderer"
configtxgen -profile $PROFILEGENESIS -channelID $CHANNELNAME -outputBlock ./../configtx/sysgenesis.block 

echo " ==> Crypto Sys OK"

# END
