#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const crypto = require('crypto');

const BeanUser = require('../contract/lib/BeanUser.js');
const BeanFileMessage = require('../contract/lib/BeanFileMessage.js');
const BeanDataBlock = require('../contract/lib/BeanDataBlock.js');
const BeanTransaction = require('../contract/lib/BeanTransaction.js');
const ResponseModel = require('../contract/lib/ResponseModel.js');
const CryptoWalletPGPUtil = require('../contract/lib/CryptoWalletPGPUtil.js');
const EccUtil = require('../contract/lib/CryptoKeyUtil.js');

const ChaincodeClientTx = require('./gateway/ChaincodeClientTx.js');
const ClientReference = require('./ClientReference.js');
const ClientUtil = require('./ClientUtil.js');

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const base64 = BeanTransaction.getBASE64();
const sha256 = BeanTransaction.getSHA256();
const algoritsymm = BeanTransaction.getALGORITSYMM();

const transactionRetrieve = BeanTransaction.getTxStatus().RETRIEVE;
const contractName = BeanTransaction.getContractName();

const JsonSubmitToIssue = ClientReference.getJsonSubmitToIssue();
const DocJsonIssued = ClientReference.getDocJsonIssued();

const JsonSubmitToValidate = ClientReference.getJsonSubmitToValidate();
const DocJsonValidated = ClientReference.getDocJsonValidated();

const JsonSubmitToRetrieve = ClientReference.getJsonSubmitToRetrieve();
const DocJsonRetrieved = ClientReference.getDocJsonRetrieved();

const JsonSubmitToRead = ClientReference.getJsonSubmitToRead();
const DocJsonRead = ClientReference.getDocJsonRead();

const dirWallets = '../wallet';

const quantArgs = 2;

const logPrefix = '\n {testDocEquality} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) console.log(logPrefix + text);
}

/**
 * Translate data from JSON format to OBJECT format.
 * @param {json} fileJSON File with data block.
 */
function getObjectFromFile(fileJSON){
    
    let fileBlockData = fs.readFileSync(fileJSON, utf8);

    if (fileBlockData == undefined || fileBlockData === null) {
        let msgError = `Impossible to load file: ${pathFile}`;
        logWrite(`[getObjectFromFile] Message: ${msgError}`);
        throw msgError;
        // stop here
    }

    let blockDataJSon = JSON.parse(fileBlockData);
    let blockData = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    return blockData;
}


// Main program function
async function main() {

    try {
        var origin = getObjectFromFile(DocJsonValidated);

        var ledger = getObjectFromFile(DocJsonIssued);
    
        if (origin.equals(ledger)){
            logWrite(`Equals`);
        } else {
            logWrite(`Not Equals`);
        }
    } catch (error) {
        logWrite(error.stack);
    }

    return true;
}


main().then(() => {

    console.log('\n Read program complete. \n');

}).catch((e) => {

    console.log('\n Read program exception. \n');
    console.log(e);
    process.exit(-1);

});

