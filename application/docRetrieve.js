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
 * 4. Request a document from ledger, based in a specific key.
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

const logPrefix = '\n {docRetrieve} ';

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
        logWrite(`[main, A] Message: ${msgError}`);
        throw msgError;
    }

    var organizationName = appArgs[0]; // Organization Name
    var walletName = appArgs[1]; // Name of the user that will send file

    var paramsOK = await assertParams(organizationName, walletName);
    if (!paramsOK) {
        logWrite('[main, B] Parameters Failed to Load');
    }

    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);

    var chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWallets, organizationName, walletName, transactionRetrieve, contractName, pathOfGatewayConfig);

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

    logWrite(`[main] dirWallets = ${dirWallets} ; organizationName = ${organizationName}; walletName = ${walletName}; transaction = ${transactionRetrieve}; contractName = ${contractName}; pathOfGatewayConfig = ${pathOfGatewayConfig}`);
    logWrite('[main] Data to submit in transaction = ' + JSON.stringify(dataToSubmit));

    // Save to filesystem before to read data set 
    if (logActive) { fs.writeFileSync(JsonSubmitToRetrieve, dataToSubmit.serialize(), utf8); }

    /*
     * ============================================================================
     * Submit transaction into Fabric ledger
     */
    var txResponse = await chaincodeTx.processBlockchainTransaction(dataToSubmit);

    if (txResponse == null || txResponse == undefined) {
        let msgError = `The response from ledger is NULL or UNDEFINED`;
        logWrite(`[main, C] Message: ${msgError}`);
        throw msgError;
    }

    /*
    ** Manter esse trecho de código por causa da tradução do resultado com o ledger
    *
    * 
            logWrite(`[main] ${txResponse}`);
            let objTxRetrieve = JSON.parse(txResponse);

            let byteArray = objTxRetrieve.data;
            logWrite(`[main] ${byteArray}`);

            let bufferWithJson = Buffer.from(byteArray);

            logWrite(`[main] ${bufferWithJson.toString()}`);

            let prototypeResponse = JSON.parse(bufferWithJson.toString());

            var response = ResponseModel.createResponseModel(prototypeResponse);

    */
    
    /*
     * ============================================================================
     * Under this point the code process the result from ledger processing
     */
    var response = ResponseModel.translateLedgerResponse(txResponse);

    logWrite(`[main] ResponseModel object =  ${response.serialize()}`);
    
    // Validate the success of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().FAIL) {
        logWrite(`[main, D] Error message = ${response.txMessage}`);
        logWrite(`[main] Error stack = ${response.txContent}`);
        throw response.txMessage;
    }

    logWrite(`[main] Transaction Message = ${response.txMessage}`);

    // Validate the situation of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        logWrite(`[main, E] Message = ${response.txMessage}`);
        logWrite(`[main] Content = ${response.txContent}`);
        throw response.txMessage;
    }

    //===============================================================================
    // Process the content of the transaction
    var blockDataJSon = JSON.parse(response.txContent);
    
    logWrite('[main] Bloco de dados = ' + JSON.stringify(blockDataJSon));

    var blockDataAfterResponse = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    var status = blockDataAfterResponse.status;

    logWrite(`[main] Document status = ${status}`);

    readerPGP.setPassword(blockDataAfterResponse.reader.password);
    readerPGP.setInitVector(blockDataAfterResponse.reader.initVector);

    // Prevents the private dataset from being inside the user's data
    readerPGP.clearSecurityData();

    blockDataAfterResponse.setReader(readerPGP);

    logWrite(`[main] Document content = ${JSON.stringify(blockDataAfterResponse)}`);

    // Write data do filesystem after RETRIEVE
    fs.writeFileSync(DocJsonRetrieved, blockDataAfterResponse.serialize(), utf8);
}


main().then(() => {

    console.log('\n Retrieve program complete. \n');

}).catch((e) => {

    console.log('\n Retrieve program exception. \n');
    console.log(e);
    process.exit(-1);

});

