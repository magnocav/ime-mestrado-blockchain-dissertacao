#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

/**
 * Command Line Parameters
 * 1. organizationName
 * 2. walletName
 */

/*
 * This application has these basic steps:
 * 1. Select an identity from a wallet.
 * 2. Connect to network gateway.
 * 3. Access blockchain network.
 * 4. Request a collection of registries about one document-key from ledger.
 * 5. Process response.
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

const transactionHistory = BeanTransaction.getTxStatus().HISTORY;
const contractName = BeanTransaction.getContractName();

const DocJsonIssued = ClientReference.getDocJsonIssued();

const JsonSubmitToHistory = ClientReference.getJsonSubmitToHistory();
const DocJsonHistory = ClientReference.getDocJsonHistory();

const dirWallets = '../wallet';

const quantArgs = 2;

const logPrefix = '\n {docHistory} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) console.log(logPrefix + text);
}

/**
 * Checks the completeness of the parameters passed to the logic.
 * @param {string} organizationName Organization name.
 * @param {string} walletName Wallet user name.
 */
async function assertParams(organizationName, walletName) {

    let errorMessage = `\n All parameters must be set. `;
    let erroFlag = false;

    if (organizationName == undefined || organizationName == null) {
        errorMessage = errorMessage + ` Organization Issuer Name is undefined. `;
        erroFlag = true;
    }

    if (walletName == undefined || walletName == null) {
        errorMessage = errorMessage + ` Wallet Issuer Name is undefined. `;
        erroFlag = true;
    }

    if (erroFlag) {
        throw errorMessage;
    }
}


/**
 * Main program function
 */
async function main() {

    // File with target block data
    var fileFromReference = DocJsonIssued;

    var appArgs = process.argv.slice(2);

    logWrite('[main] appArgs = ', appArgs);

    if (appArgs == undefined || appArgs.length < quantArgs) {
        let msgError = `You must specify ${quantArgs} arguments in lower case: \"Organization Reader Name\" and \"Wallet Reader Name\"`;
        logWrite(`[main, 1] Message: ${msgError}`);
        throw msgError;
    }

    var organizationName = appArgs[0]; // Organization Name
    var walletName = appArgs[1]; // Name of the user that will send file

    var paramsOK = await assertParams(organizationName, walletName);
    if (!paramsOK) {
        logWrite('[main, 2] Parameters Failed to Load');
    }

    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);

    var chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWallets, organizationName, walletName, transactionHistory, contractName, pathOfGatewayConfig);

    var docUtil = ClientUtil.newClientUtil();

    var readerPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    var documentKey = await docUtil.getDocumentKey(fileFromReference);

    let persona = BeanUser.createBeanUser(readerPGP);
    
    // Prevents the private dataset from being inside the user's data
    persona.clearSecurityData();

    // Creates the empty data block
    var dataToSubmit = BeanDataBlock.newBeanDataBlock();

    dataToSubmit.setReader(persona);
    dataToSubmit.setKey(documentKey);

    logWrite(`[main] dirWallets = ${dirWallets} ; organizationName = ${organizationName}; walletName = ${walletName}; transaction = ${transactionHistory}; contractName = ${contractName}; pathOfGatewayConfig = ${pathOfGatewayConfig}`);
    logWrite('[main] Data to submit in transaction = ' + JSON.stringify(dataToSubmit));

    // Save to filesystem before to read data set 
    if (logActive) { fs.writeFileSync(JsonSubmitToHistory, dataToSubmit.serialize(), utf8); }

    /*
     * ============================================================================
     * Submit transaction into Fabric ledger
     */
    var txResponse = await chaincodeTx.processBlockchainTransaction(dataToSubmit);

    if (txResponse == null || txResponse == undefined) {
        let msgError = `The response from ledger is NULL or UNDEFINED`;
        logWrite(`[main, 3] Message: ${msgError}`);
        throw msgError;
    }
  
    /*
     * ============================================================================
     * Under this point the code process the result from ledger processing
     */
    var response = ResponseModel.translateLedgerResponse(txResponse);

    logWrite(`[main] ResponseModel object =  ${response.serialize()}`);
    
    // Validate the success of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().FAIL) {
        logWrite(`[main, A] Error message = ${response.txMessage}`);
        logWrite(`[main] Error stack = ${response.txContent}`);
        throw response.txMessage;
    }

    logWrite(`[main] Transaction Message = ${response.txMessage}`);

    // Validate the situation of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        logWrite(`[main, B] Message = ${response.txMessage}`);
        logWrite(`[main] Content = ${response.txContent}`);
        throw response.txMessage;
    }

    //===============================================================================
    // Process the content of the transaction
    var historyJson = JSON.stringify(response.txContent);
    
    logWrite('[main] History of transactions = ' + historyJson);

    // Write data do filesystem after HISTORY
    fs.writeFileSync(DocJsonHistory, Buffer.from(historyJson.toString()), utf8);
}


main().then(() => {

    console.log('\n History program complete. \n');

}).catch((e) => {

    console.log('\n History program exception. \n');
    console.log(e);
    process.exit(-1);

});

