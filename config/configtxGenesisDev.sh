#!/bin/bash
# ----------
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
# ----------
#

PROFILEGENESIS=MultiOrgMSPSolo
PROFILECHANNEL=MultiOrgMSPChannel
CHANNELNAME=devchannel

rm -f ./../configtx/dev*.block
rm -f ./../configtx/$CHANNELNAME.tx
rm -f ./../configtx/$CHANNELNAME-*Anchor.tx 

echo "Generate $CHANNELNAME configuration transaction file"
configtxgen -profile $PROFILECHANNEL -channelID $CHANNELNAME -outputCreateChannelTx ./../configtx/${CHANNELNAME}track.tx

echo " ==> Crypto Dev OK"

# END
