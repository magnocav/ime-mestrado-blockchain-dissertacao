#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

 // Bring key classes into scope, most importantly Fabric SDK network class
 const fs = require('fs');
 const yaml = require('js-yaml');
 const { FileSystemWallet, Gateway } = require('fabric-network');
 
//=================================================================
 // A wallet stores a collection of identities for use
  const wallet = new FileSystemWallet('../wallet/guarani/alice');

 // Specify userName for network access
 const userName = 'User2@guarani.blockchain.biz';

 // Network configuration
 const networkYAML = './gateway/devchannelConnectionGuarani.yaml';

 // Channel name
 const channelNAME = 'devchannel';

 // Peer name
 const peerName = 'peer0.guarani.blockchain.biz';
 //=================================================================


 // Main program function
async function main() {

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync(networkYAML, 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled:false, asLocalhost: false }
        };

        console.log('Before connect to Fabric gateway, using application specified parameters');
        
        await gateway.connect(connectionProfile, connectionOptions);
        console.log('After connect to Fabric Gateway.');

        console.log(`Access blockchain network. Use network channel: ${channelNAME} . `);

        var network = await gateway.getNetwork(channelNAME);
        console.log(`Network connection OK to: ${channelNAME} . `);

        console.log('Before getClient from Gateway');
        
        var client = gateway.getClient();
        console.log('After getClient from Gateway. Is in DevMode? = ' + client.isDevMode());
        
        var peer = client.getPeer(peerName);
        console.log('After getPeer from Client. Peer = ' + peer.toString());

        console.log('Test OK');

    } catch (error) {

        console.log('Test FAIL');
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric Gateway.');
        gateway.disconnect();
    }
}
main().then(() => {

    console.log('Program complete.');

}).catch((e) => {

    console.log('Program exception.');
    console.log(e);
    process.exit(-1);

});