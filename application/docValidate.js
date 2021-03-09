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
 * 7. Construct a transaction to validate the document.
 * 8. Submit validate transaction to ledger.
 * 9. Process response.
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
const transactionValidate = BeanTransaction.getTxStatus().VALIDATE;
const contractName = BeanTransaction.getContractName();

const JsonSubmitToIssue = ClientReference.getJsonSubmitToIssue();
const DocJsonIssued = ClientReference.getDocJsonIssued();

const JsonSubmitToValidate = ClientReference.getJsonSubmitToValidate();
const DocJsonValidated = ClientReference.getDocJsonValidated();

const JsonSubmitToRetrieve = ClientReference.getJsonSubmitToRetrieve();
const DocJsonRetrieved = ClientReference.getDocJsonRetrieved();

const dirWallets = '../wallet';

const quantArgs = 2;

const logPrefix = '\n {docValidate} ';

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
 * @param {string} contractName Smart contract (chaincode) name.
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
async function retrieveDocument(chaincodeTxRetrieve, documentKey, validator){
    
    let persona = BeanUser.createBeanUser(validator);
    
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
    
    // Process transaction into ledger
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
 * Process the effective validation over dataset about document.
 * @param {ChaincodeClientTx} chaincodeTxValidate Transaction client to connect on ledger.
 * @param {BeanUser} validator User as validator role.
 * @param {BeanDataBlock} blockData Data block with the set of process information.
 */
async function validateDocument(chaincodeTxValidate, validator, blockData){
    
    // Add Validator data to block
    var blockDataValidator = await processToAddValidator(validator, blockData);

    blockDataValidator.configDateTimeLedger();

    logWrite('[validateDocument] Data to submit in transaction = ' + JSON.stringify(blockDataValidator));

    // Save in file before to submit
    if (logActive) { fs.writeFileSync(JsonSubmitToValidate, blockDataValidator.serialize(), utf8); }

    //----------------------------------------------------------------------------------
    // Process transaction into Fabric ledger
    var txResponse = await chaincodeTxValidate.processBlockchainTransaction(blockDataValidator);
    
    if (txResponse == null || txResponse == undefined) {
        let msgError = `The response from ledger is NULL or UNDEFINED`;
        logWrite(`[validateDocument, A] Message: ${msgError}`);
        throw msgError;
    }

    // Treatment about data received as response from ledger
    var response = ResponseModel.translateLedgerResponse(txResponse);

    logWrite(`[validateDocument] ResponseModel object =  ${response.serialize()}`);

    // Validate the success of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().FAIL){
        logWrite(`[validateDocument, B] Error message = ${response.txMessage}`);
        logWrite(`[validateDocument] Error stack = ${response.txContent}`);
        throw response.txMessage;
    }

    logWrite(`[validateDocument] Transaction Message = ${response.txMessage}`);

    // Validate the situation of transaction
    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        logWrite(`[validateDocument, C] Message = ${response.txMessage}`);
        logWrite(`[validateDocument] Content = ${response.txContent}`);
        throw response.txMessage;
    }

    // Process the content of the transaction
    var blockDataJSon = JSON.parse(response.txContent);

    logWrite('[validateDocument] Bloco de dados = ' + JSON.stringify(blockDataJSon));
    
    var blockDataAfterValidated = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    var status = blockDataAfterValidated.status;

    logWrite(`[validateDocument] Document status = ${status}`);

    return blockDataAfterValidated;
}


/**
 * Adds validator data to the block.
 * @param {BeanUser} validator User as validator role.
 * @param {BeanDataBlock} blockData Data block with the set of process information.Data block with the set of process information. 
 */
async function processToAddValidator(validator, blockData) {

    validator = await BeanUser.generateSignatureOfUserInfos(validator);

    /*
     * Validator signs the hash generated from the concatenation of recipient identifiers.
     * The signature on this hash guarantees to the inspector that the recipients were chosen by Validator
     */
    let recipientsHash = blockData.recipientsHash;

    // Validator + Recipient will have to validate this signature on the hash
    let recipientsHashSigned = await EccUtil.signMessage(validator, recipientsHash);
    blockData.setRecipientsHashSignedByValidator(recipientsHashSigned);

    // Get the system date-time to use in the information block
    let dateTimeValidate = new Date();
    blockData.setDateTimeValidate(dateTimeValidate.toISOString());

    /**
     * The date-time must be signed by the Validator to avoid tampering.
     * Reader will have to validate that signature on the date-time's hash.
     */
    let hashFactory = createHash();
    let dateTimeValidateHash = hashFactory.update(blockData.dateTimeValidate).digest(hex);

    let dateTimeSignedByValidator = await EccUtil.signMessage(validator, dateTimeValidateHash);

    // Validation date-time signed by the Validator
    blockData.setDateTimeSignedByValidator(dateTimeSignedByValidator);

    // Set status to VALIDATED
    blockData.setStatus(BeanDataBlock.getBlockState().VALIDATED);

    let validatorPersona = BeanUser.createBeanUser(validator);
    
    // Prevents the private dataset from being inside the user's data
    validatorPersona.clearSecurityData();

    blockData.setValidator(validatorPersona);

    // Calculates the hash for the merkle root in the data registered by the Validator
    let merkleRootValidator = BeanDataBlock.calculateMerkleRootValidator(blockData);

    logWrite('[processToAddValidator] MerkleRootValidator = ' + merkleRootValidator);

    // Validator block merkle root
    blockData.setMerkleRootValidator(merkleRootValidator);

    return blockData;
}


/**
 * Main program function
 */
async function main() {

    // File with target block data
    var fileFromReference = DocJsonIssued;

    var appArgs = process.argv.slice(2);

    logWrite('[main] appArgs = ', appArgs);

    if (appArgs == undefined || appArgs.length < quantArgs){
        let msgError = `You must specify ${quantArgs} arguments in lower case: \"Organization Validator Name\" and \"Wallet Reader Name\"`;
        logWrite(`[main, A] Message: ${msgError}`);
        throw msgError;
    }

    var organizationName = appArgs[0]; // Organization Name
    var walletName = appArgs[1]; // Name of the user

    var paramsOK = await assertParams(organizationName, walletName);
    if (!paramsOK){
        logWrite('[main] Parameters Failed to Load');
    }

    var docUtil = ClientUtil.newClientUtil();

    var documentKey = await docUtil.getDocumentKey(fileFromReference);

    var validatorPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    // Prepare to Retrieve the document from the ledger
    var chaincodeTxRetrieve = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionRetrieve, contractName);    

    // Retrieve document from ledger
    var blockDataRetrieved = await retrieveDocument(chaincodeTxRetrieve, documentKey, validatorPGP);

    // Save RETRIEVED data set to filesystem
    if (logActive) { fs.writeFileSync(DocJsonRetrieved, blockDataRetrieved.serialize(), utf8); }

    var statusBefore = blockDataRetrieved.status;
    logWrite(`[main] (statusBefore) = ${statusBefore}`);

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

    } else {
        
        let msgError = 'Document was VALIDATED or REVOKED before by another processing';
        logWrite(`[main, C] Validate Message: ${msgError}`);
        throw msgError;
        //stop here;
    }

    var issuerRetrieved = blockDataRetrieved.issuer;

    if (validatorPGP.publicId == issuerRetrieved.publicId){

        let msgError = `Validator must be different from Issuer in document process before processing`;
        logWrite(`[main, D] Validation Message: ${msgError}`);
        throw msgError;
    }

    // Prepare to process Validate the document from the ledger
    var chaincodeTxValidate = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionValidate, contractName);  

    var blockDataValidated = await validateDocument(chaincodeTxValidate, validatorPGP, blockDataRetrieved);

    var statusAfter = blockDataValidated.status;
    logWrite(`[main] (statusAfter) = ${statusAfter}`);

    if (statusAfter != BeanDataBlock.getBlockState().VALIDATED){
        let msgError = `Document must be in VALIDATED status to be completed in process`;
        logWrite(`[main, D] Message: ${msgError}`);
        throw msgError;
    }

    logWrite(`[main] Document content = ${JSON.stringify(blockDataValidated)}`);

    // Save data set to filesystem
    fs.writeFileSync(DocJsonValidated, blockDataValidated.serialize(), utf8);

    return true;  
}


main().then(() => {

    console.log('\n Validate program complete. \n');

}).catch((e) => {

    console.log('\n Validate program exception. \n');
    console.log(e);
    process.exit(-1);

});

