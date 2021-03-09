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
 * 6. Check validations in document.
 * 7. Construct a transaction to revoke the document.
 * 8. Submit revoke transaction to ledger.
 * 9. Process response.
  */

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const crypto = require('crypto');

const BeanUser = require('../contract/lib/BeanUser.js');
const BeanFileMessage = require('../contract/lib/BeanFileMessage.js');
const BeanDataBlock = require('../contract/lib/BeanDataBlock.js');
const BeanTransaction = require('../contract/lib/BeanTransaction.js');
const ResponseModel = require('../contract/lib/ResponseModel.js');
const EccUtil = require('../contract/lib/CryptoKeyUtil.js');

const ChaincodeClientTx = require('./gateway/ChaincodeClientTx.js');
const ClientReference = require('./ClientReference.js');
const ClientUtil = require('./ClientUtil.js');

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const sha256 = BeanTransaction.getSHA256();

const transactionRetrieve = BeanTransaction.getTxStatus().RETRIEVE;
const transactionRevoke = BeanTransaction.getTxStatus().REVOKE;
const contractName = BeanTransaction.getContractName();

const JsonSubmitToIssue = ClientReference.getJsonSubmitToIssue();
const DocJsonIssued = ClientReference.getDocJsonIssued();

const JsonSubmitToValidate = ClientReference.getJsonSubmitToValidate();
const DocJsonValidated = ClientReference.getDocJsonValidated();

const JsonSubmitToRetrieve = ClientReference.getJsonSubmitToRetrieve();
const DocJsonRetrieved = ClientReference.getDocJsonRetrieved();

const JsonSubmitToRead = ClientReference.getJsonSubmitToRead();
const DocJsonRead = ClientReference.getDocJsonRead();

const JsonSubmitToRevoke = ClientReference.getJsonSubmitToRevoke();
const DocJsonRevoked = ClientReference.getDocJsonRevoked();

const dirWallets = '../wallet';

const quantArgs = 2;

const logPrefix = '\n {docRevoke} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text){
    if (logActive) console.log(logPrefix+ text);
}

/**
 * Creates the hash factory, to later generate a new hash when the text is parameterized.
 */
function createHash() {
    return crypto.createHash(sha256);
}

/**
 * Checks the completeness of the parameters passed to the logic.
 * @param {string} organizationName Organization name.
 * @param {string} walletName Wallet user name.
 */
async function assertParams(organizationName, walletName){

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

    if (erroFlag){
        throw errorMessage;
    }
}

/**
 * Configures a object with properties to connect as a client to the blockchain network.
 * Prepare to retrieve the document from the ledger.
 * @param {string} dirWalletsTx Directory with wallet PGP.
 * @param {string} organizationName Organization name.
 * @param {string} walletName Wallet user name.
 * @param {string} transaction Transaction name.
 * @param {string} contractName Smart-contract (chaincode) name.
 */
async function prepareChaincodeClientTx(dirWalletsTx, organizationName, walletName, transaction, contractName) {

    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);
    
    let chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWalletsTx, organizationName, walletName, transaction, contractName, pathOfGatewayConfig);

    return chaincodeTx;
}


/**
 * Process a request in the ledger to get a document, based in a document-key.
 * @param {ChaincodeClientTx} chaincodeTxRetrieve Transaction client to connect on ledger.
 * @param {string} documentKey The document key.
 * @param {BeanUser} validator User as validator role.
 */
async function retrieveDocument(chaincodeTxRetrieve, documentKey, revoker){

    let persona = BeanUser.createBeanUser(revoker);
    
    // Prevents the private dataset from being inside the user's data
    persona.clearSecurityData();

    // Creates the empty data block
    var dataToSubmit = BeanDataBlock.newBeanDataBlock();

    dataToSubmit.setReader(persona);
    dataToSubmit.setKey(documentKey);
    
    logWrite('[retrieveDocument] Data to submit in transaction = ' + JSON.stringify(dataToSubmit));

    if (logActive) { fs.writeFileSync(JsonSubmitToRetrieve, dataToSubmit.serialize(), utf8); }
    
    //----------------------------------------------------------------------------------
    // Retrieve the document from the ledger
    
    // Process transaction into Fabric ledger
    var txResponse = await chaincodeTxRetrieve.processBlockchainTransaction(dataToSubmit);

    if (txResponse == null || txResponse == undefined) {
        let msgError = `The response from ledger is NULL or UNDEFINED`;
        logWrite(`[retrieveDocument, A] Message: ${msgError}`);
        throw msgError;
    }

    // Treatment about data received as response from Ledger
    var response = ResponseModel.translateLedgerResponse(txResponse);

    logWrite(`[retrieveDocument] ResponseModel object =  ${response.serialize()}`);

    // Validate the success of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().FAIL){
        logWrite(`[retrieveDocument, B] Error message = ${response.txMessage}`);
        logWrite(`[retrieveDocument] Error stack = ${response.txContent}`);
        throw response.txMessage;
    }

    logWrite(`[retrieveDocument] Transaction Message = ${response.txMessage}`);

    // Validate the situation of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        logWrite(`[retrieveDocument, C] Message = ${response.txMessage}`);
        logWrite(`[retrieveDocument] Content = ${response.txContent}`);
        throw response.txMessage;
    }

    // Process the content of the transaction
    var blockDataJSon = JSON.parse(response.txContent);

    logWrite('[retrieveDocument] Bloco de dados = ' + JSON.stringify(blockDataJSon));
    
    var blockDataAfterRetrieve = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    var status = blockDataAfterRetrieve.status;

    logWrite(`[retrieveDocument] Document status = ${status}`);

    return blockDataAfterRetrieve;
}

/**
 * Process the effective revocation over dataset about document.
 * @param {ChaincodeClientTx} chaincodeTxRevoke Transaction client to connect on ledger.
 * @param {BeanUser} revoker User as revoker role. 
 * @param {BeanDataBlock} blockData Data block with the set of process information.
 */
async function revokeDocument(chaincodeTxRevoke, revoker, blockData){
    
    // Add revoker data to block
    var blockDataRevoker = await processToAddRevoker(revoker, blockData);

    blockDataRevoker.configDateTimeLedger();

    logWrite('[revokeDocument] Data to submit in transaction = ' + JSON.stringify(blockDataRevoker));

    // Save in file before to submit
    if (logActive) { fs.writeFileSync(JsonSubmitToRevoke, blockDataRevoker.serialize(), utf8); }

    //----------------------------------------------------------------------------------
    // Process transaction into Fabric ledger
    var txResponse = await chaincodeTxRevoke.processBlockchainTransaction(blockDataRevoker);
    
    if (txResponse == null || txResponse == undefined) {
        let msgError = `The response from ledger is NULL or UNDEFINED`;
        logWrite(`[revokeDocument, A] Message: ${msgError}`);
        throw msgError;
    }

    // Treatment about data received as response from Ledger
    var response = ResponseModel.translateLedgerResponse(txResponse);

    logWrite(`[revokeDocument] ResponseModel object =  ${response.serialize()}`);

    // Validate the success of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().FAIL){
        logWrite(`[revokeDocument, B] Error message = ${response.txMessage}`);
        logWrite(`[revokeDocument] Error stack = ${response.txContent}`);
        throw response.txMessage;
    }

    logWrite(`[revokeDocument] Transaction Message = ${response.txMessage}`);

    // Validate the situation of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        logWrite(`[revokeDocument, C] Message = ${response.txMessage}`);
        logWrite(`[revokeDocument] Content = ${response.txContent}`);
        throw response.txMessage;
    }

    // Process the content of the transaction
    var blockDataJSon = JSON.parse(response.txContent);

    logWrite('[revokeDocument] Bloco de dados = ' + JSON.stringify(blockDataJSon));
    
    var blockDataAfterRevoke = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    var status = blockDataAfterRevoke.status;

    logWrite(`[revokeDocument] Document status = ${status}`);

    return blockDataAfterRevoke;
}


/**
 * Adds revoker data to the block.
 * @param {BeanUser} revoker User as revoker role.  
 * @param {BeanDataBlock} blockData Data block with the set of process information. 
 */
async function processToAddRevoker(revoker, blockData) {

    revoker = await BeanUser.generateSignatureOfUserInfos(revoker);
    
    // Get the system date-time to use in the data block
    var dateTimeRevoke = new Date();
    blockData.setDateTimeRevoke(dateTimeRevoke.toISOString());

    /*
     * The date-time must be signed by the Revoker to avoid tampering
     */
	let dateTimeHashFactory = createHash();
    let dateTimeRevokeHash = dateTimeHashFactory.update(blockData.dateTimeRevoke).digest(hex);

    var dateTimeSignedByRevoker = await EccUtil.signMessage(revoker, dateTimeRevokeHash);

    // Validation date-time signed
    blockData.setDateTimeSignedByRevoker(dateTimeSignedByRevoker);

    // Set status to VALIDATED
    blockData.setStatus(BeanDataBlock.getBlockState().REVOKED);

	var revokerPersona = BeanUser.createBeanUser(revoker);
    
    // Prevents the private dataset from being inside the user's data
    revokerPersona.clearSecurityData();

	blockData.setRevoker(revokerPersona);
      
    return blockData;        
}


/**
 * Main program function
 */
async function main() {

    // File with target block data
    var fileFromReference = DocJsonIssued; //DocJsonValidated;

    var appArgs = process.argv.slice(2);

    logWrite('[main] appArgs = ', appArgs);

    if (appArgs == undefined || appArgs.length < quantArgs){
        let msgError = `You must specify ${quantArgs} arguments in lower case: \"Organization Reader Name\" and \"Wallet Reader Name\"`;
        logWrite(`[main, A] Message: ${msgError}`);
        throw msgError;
    }

    var organizationName = appArgs[0]; // Organization Name
    var walletName = appArgs[1]; // Name of the user that will send file

    var paramsOK = await assertParams(organizationName, walletName);
    if (!paramsOK){
        logWrite('[main] Parameters Failed to Load');
    }

    var docUtil = ClientUtil.newClientUtil();

    var documentKey = await docUtil.getDocumentKey(fileFromReference);

    var revokerPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    // Prepare to retrieve the document from the ledger
    var chaincodeTxRetrieve = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionRetrieve, contractName);    

    // Retrieve document from ledger
    var blockDataRetrieved = await retrieveDocument(chaincodeTxRetrieve, documentKey, revokerPGP);

    // Save RETRIEVED data set to filesystem
    if (logActive) { fs.writeFileSync(DocJsonRetrieved, blockDataRetrieved.serialize(), utf8); }

    var statusBefore = blockDataRetrieved.status;

    logWrite(`[main] statusBefore = ${statusBefore}`);

    if (statusBefore == BeanDataBlock.getBlockState().ISSUED){
        
        // Validate Issuer Data
        var issuerVerify = await docUtil.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            let msgError = 'Issuer data is invalid inside block';
            logWrite(`[main, B] Issue Validation Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        logWrite(`[main] Issuer data is valid inside block`);

    } else if (statusBefore == BeanDataBlock.getBlockState().VALIDATED){
            
        // Validate Issuer Data
        var issuerVerify = await docUtil.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            let msgError = 'Issuer data is invalid inside block';
            logWrite(`[main. C] Issue Validation Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        logWrite(`[main] Issuer data is valid inside block`);
        
        // Validate Validator Data
        var validatorVerify = await docUtil.validateValidatorBlock(blockDataRetrieved);
        if (validatorVerify == false){
            let msgError = 'Validator data is invalid inside block';
            logWrite(`[main, D] Validate Validation Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        logWrite(`[main] Validator data is valid inside block`);

    } else {
        let msgError = 'Document was REVOKED before by another processing';
        logWrite(`[main, E] Revoke Validation = ${msgError}`);
        throw msgError;
    }

    var issuerRetrieved = blockDataRetrieved.issuer;
    var validatorRetrieved = blockDataRetrieved.validator;

    if ((revokerPGP.publicId != issuerRetrieved.publicId) && (revokerPGP.publicId != validatorRetrieved.publicId)){
        let msgError = `Revoker must be Issuer or Validator in document process before processing`;
        logWrite(`[main, F] message error = ${msgError}`);
        throw msgError;
    }

    // Prepare to revoke the document from the ledger
    var chaincodeTxRevoke = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionRevoke, contractName);  

    var blockDataRevoked = await revokeDocument(chaincodeTxRevoke, revokerPGP, blockDataRetrieved);

    var statusAfter = blockDataRevoked.status;
    logWrite(`[main] status after = ${statusAfter}`);

    if (statusAfter != BeanDataBlock.getBlockState().REVOKED){
        let msgError = `Document must be in REVOKED status to be completed in process`;
        logWrite(`[main, G] message error = ${msgError}`);
        throw msgError;
    }

    logWrite(`[main] Document content = ${JSON.stringify(blockDataRevoked)}`);

    // Save data set to filesystem
    fs.writeFileSync(DocJsonRevoked, blockDataRevoked.serialize(), utf8);

    return true;  
}


main().then(() => {

    console.log('\n Revoke program complete. \n ');

}).catch((e) => {

    console.log('\n Revoke program exception. \n');
    console.log(e);
    process.exit(-1);

});

