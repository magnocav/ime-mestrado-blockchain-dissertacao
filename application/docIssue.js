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
 * 3. filePath
 */

/*
 * This application has these basic steps:
 * 1. Select an identity from a wallet.
 * 2. Connect to network gateway.
 * 3. Access blockchain network.
 * 4. Construct a transaction to issue document.
 * 5. Submit issue transaction to ledger.
 * 6. Process response.
 */

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const crypto = require('crypto');

const ChaincodeClientTx = require('./gateway/ChaincodeClientTx.js');
const Recipient = require('./gateway/Recipient.js');
const ClientReference = require('./ClientReference.js');
const ClientUtil = require('./ClientUtil.js');

const BeanUser = require('../contract/lib/BeanUser.js');
const BeanFileMessage = require('../contract/lib/BeanFileMessage.js');
const BeanDataBlock = require('../contract/lib/BeanDataBlock.js');
const BeanTransaction = require('../contract/lib/BeanTransaction.js');
const ResponseModel = require('../contract/lib/ResponseModel.js');
const CryptoWalletPGPUtil = require('../contract/lib/CryptoWalletPGPUtil.js');
const EccUtil = require('../contract/lib/CryptoKeyUtil.js');

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const base64 = BeanTransaction.getBASE64();
const sha256 = BeanTransaction.getSHA256();
const algoritsymm = BeanTransaction.getALGORITSYMM();

const transactionIssue = BeanTransaction.getTxStatus().ISSUE;
const contractName = BeanTransaction.getContractName();

const FileBase64BeforeIssue = ClientReference.getFileBase64BeforeIssue();

const JsonSubmitToIssue = ClientReference.getJsonSubmitToIssue();
const DocJsonIssued = ClientReference.getDocJsonIssued();

const dirWallets = '../wallet';

const quantArgs = 3;

const logPrefix = '\n {docIssue} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) console.log(logPrefix + text);
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
 * @param {string} filePath File path to load the file.
 */
async function assertParams(organizationName, walletName, filePath) {

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

    if (filePath == undefined || filePath == null) {
        errorMessage = errorMessage + ` File path is undefined. `;
        erroFlag = true;
    }

    if (erroFlag) {
        throw errorMessage;
    }
}


/**
 * Adds issuer data to the block.
 * @param {BeanUser} issuer User as issuer role.
 * @param {BeanDataBlock} blockData Data block with the set of process information.
 */
async function processToAddIssuer(issuer, blockData) {

    issuer = await BeanUser.generateSignatureOfUserInfos(issuer);

    /*
     * Issuer signs the hash generated from the concatenation of Recipient identifiers
     * The signature on this hash guarantees to Validator that the recipients were chosen by Issuer
     */
    let recipientsHash = blockData.recipientsHash;

    // Validator + Recipient will have to validate this signature on the hash
    let recipientsHashSigned = await EccUtil.signMessage(issuer, recipientsHash);
    blockData.setRecipientsHashSignedByIssuer(recipientsHashSigned);

    // Get the system date-time to use in the information block
    let dateTimeIssue = new Date();
    blockData.setDateTimeIssue(dateTimeIssue.toISOString());

    /*
    * The date and time must be signed by Issuer to avoid forgery.
    * Recipient will have to validate this signature over the date hash.
    */
    let hashFactory = createHash();
    let dateTimeIssueHash = hashFactory.update(blockData.dateTimeIssue).digest(hex);

    let dateTimeSignedByIssuer = await EccUtil.signMessage(issuer, dateTimeIssueHash);

    // Validation date-time signed
    blockData.setDateTimeSignedByIssuer(dateTimeSignedByIssuer);

    // Set status to ISSUED
    blockData.setStatus(BeanDataBlock.getBlockState().ISSUED);

    let issuerPersona = BeanUser.createBeanUser(issuer);

    // Prevents the private dataset from being inside the user's data
    issuerPersona.clearSecurityData();

    blockData.setIssuer(issuerPersona);

    // Calculates the hash for the Issuer's merkle root
    let merkleRootIssuer = BeanDataBlock.calculateMerkleRootIssuer(blockData);

    logWrite('[processToAddIssuer] MerkleRootIssuer = ' + merkleRootIssuer);

    // Issuer's block merkle root
    blockData.setMerkleRootIssuer(merkleRootIssuer);

    return blockData;
}

/**
 * Prepare data block to submit to the ledger.
 * @param {string} dirWallets Directory with wallet PGP.
 * @param {string} organizationName Organization name.
 * @param {string} walletName Wallet user name.
 * @param {string} filePath File path to load the file.
 * @param {array} destinationsArray Array with recipients list.
 */
async function prepareDataToSubmit(dirWallets, organizationName, walletName, filePath, destinationsArray) {

    // Get Sender user
    var docUtil = ClientUtil.newClientUtil();

    var issuerPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    logWrite('[prepareDataToSubmit] Issuer = ' + JSON.stringify(issuerPGP));

    //-------------------------------------------------
    // Load binary file (message) from the system
    var pathFile = filePath;

    var fileStat = fs.statSync(pathFile);
    var fileBuff = fs.readFileSync(pathFile);
    logWrite('[prepareDataToSubmit] fileBuff.length = ' + fileBuff.length);

    /*
     * Transform from binary to Base64 string
     * https://stackoverflow.com/questions/28834835/readfile-in-base64-nodejs
     */
    const msgFileContentBase64 = Buffer.from(fileBuff).toString(base64);

    // Testing the contents of the transformed file from binary to base64, so that it is later encrypted
    if (logActive) fs.writeFileSync(FileBase64BeforeIssue, msgFileContentBase64.toString(), utf8);

    /*
     * Hash the file in Base64.
     * This hash will then be signed by Issuer and then encrypted.
     */
    let msgHashFactory = createHash();
    var msgHashFileContent = msgHashFactory.update(msgFileContentBase64).digest(hex);
    logWrite('[prepareDataToSubmit] msgHashFileContent = ' + msgHashFileContent);

    /*
     * Issuer sign the file-message's hash with his secret key.
     * Reader will have to check this signature.
     */
    var msgHashFileSigned = await EccUtil.signMessage(issuerPGP, msgHashFileContent);;

    logWrite('[prepareDataToSubmit] msgHashFileSigned = ' + msgHashFileSigned);

    // Generate random password for use with AES-256-CBC
    const password = crypto.randomBytes(32);

    // Save password as Base64
    const passwordBase64 = Buffer.from(password).toString(base64);
    logWrite('[prepareDataToSubmit] passwordBase64 = ' + passwordBase64);

    // Generate random inicialization vector for use with AES-256-CBC
    const initVector = crypto.randomBytes(16);

    // Save the inicialization vector as Base64
    const initVectorBase64 = Buffer.from(initVector).toString(base64);
    logWrite('[prepareDataToSubmit] initVectorBase64 = ' + initVectorBase64);

    /**
     * Create AES encryption.
     */
    function createCipher() {
        return crypto.createCipheriv(algoritsymm, Buffer.from(password), initVector);
    }

    /*
     * Encrypt the file with the symmetric password, and save.
     * Encrypt message with AES.
     */
    var cipher = createCipher();
    var msgEncrypted = cipher.update(msgFileContentBase64);
    msgEncrypted = Buffer.concat([msgEncrypted, cipher.final()]).toString(hex);

    // Encrypt hash of the message that was signed by Issuer
    cipher = createCipher();
    var msgHashFileSignedEncrypted = cipher.update(msgHashFileSigned);
    msgHashFileSignedEncrypted = Buffer.concat([msgHashFileSignedEncrypted, cipher.final()]).toString(hex);

    // Encrypt message metadata
    const msgFileName = path.basename(pathFile);
    cipher = createCipher();
    var msgFileNameEncrypted = cipher.update(msgFileName);
    msgFileNameEncrypted = Buffer.concat([msgFileNameEncrypted, cipher.final()]).toString(hex);

    // https://stackoverflow.com/questions/10431845/node-js-file-system-get-file-type-solution-around-year-2012
    const msgFileType = mime.getType(pathFile);
    cipher = createCipher();
    var msgFileTypeEncrypted = cipher.update(msgFileType);
    msgFileTypeEncrypted = Buffer.concat([msgFileTypeEncrypted, cipher.final()]).toString(hex);

    // https://stackoverflow.com/questions/10865347/node-js-get-file-extension
    const msgFileExtName = path.extname(pathFile);
    cipher = createCipher();
    var msgFileExtNameEncrypted = cipher.update(msgFileExtName);
    msgFileExtNameEncrypted = Buffer.concat([msgFileExtNameEncrypted, cipher.final()]).toString(hex);

    const msgFileSize = fileStat.size.toString();
    cipher = createCipher();
    var msgFileSizeEncrypted = cipher.update(msgFileSize);
    msgFileSizeEncrypted = Buffer.concat([msgFileSizeEncrypted, cipher.final()]).toString(hex);

    // Create new message record
    var fileMessage = BeanFileMessage.newBeanFileMessage();
    fileMessage.setFileName(msgFileNameEncrypted);
    fileMessage.setFileType(msgFileTypeEncrypted);
    fileMessage.setFileExtName(msgFileExtNameEncrypted);
    fileMessage.setFileSize(msgFileSizeEncrypted);
    fileMessage.setHashSigned(msgHashFileSignedEncrypted);
    fileMessage.setMessage(msgEncrypted);
    fileMessage.setTransportType(BeanFileMessage.getTransport().ENCRYPTED);

    //------------------------------------------------------

    // Create a buffer to hash the Recipients list
    var buffHashDestination = '';

    /**
     * Prepare a single recipient to add in the array of recipients.
     * @param {BeanUser} persona 
     */
    async function prepareRecipientToAdd(persona) {

        // Get Recipient User
        let recipient = BeanUser.createBeanUser(persona);

        // Concatenation of Recipients' public key hashes sequence
        buffHashDestination = buffHashDestination + recipient.publicId.toString();

        // Encrypt the AES password using the Recipient public key
        let pwdEncryptedBase64 = await EccUtil.encryptMessage(issuerPGP, passwordBase64, recipient);
        logWrite('[prepareRecipientToAdd] pwdEncryptedBase64 = ' + pwdEncryptedBase64);

        // Add encrypted password to the Recipient object
        recipient.setPassword(pwdEncryptedBase64);

        // Encrypt the inicialization vector using the Recipient's public key
        let initVecBase64Encrypted = await EccUtil.encryptMessage(issuerPGP, initVectorBase64, recipient);
        logWrite('[prepareRecipientToAdd] initVecBase64Encrypted = ' + initVecBase64Encrypted);

        // Add encrypted inicialization vector to the Recipient object
        recipient.setInitVector(initVecBase64Encrypted);

        // Prevents the private dataset from being inside the user's data
        recipient.clearSecurityData();

        return recipient;
    }

    // Create Recipient object listing
    var recipientsArray = new Array(1 + destinationsArray.length);

    // Scroll through the list of Recipients
    var i = 0;

    // Add each individual recipient to the Recipients list
    for (var len = destinationsArray.length; i < len; i++) {
        recipientsArray[i] = await prepareRecipientToAdd(destinationsArray[i]);
    }

    // Add Issuer as an individual recipient to the Recipients list
    recipientsArray[i] = await prepareRecipientToAdd(issuerPGP);

    //------------------------------------------------------
    logWrite('[prepareDataToSubmit] recipientsArray = ' + JSON.stringify(recipientsArray));

    /*
     * Build the general hash from the concatenation of the Recipient identifiers. 
     * This hash will be used in the Validation step.
     */
    let recipientsHashFactory = createHash();
    var recipientsHash = recipientsHashFactory.update(buffHashDestination.toString()).digest(hex);

    // Creates the empty data block
    var blockData = BeanDataBlock.newBeanDataBlock();

    // Recipients List
    blockData.setRecipients(recipientsArray);
    blockData.setRecipientsHash(recipientsHash);

    // AES encrypted message with password
    blockData.setFileMessage(fileMessage);

    // Add the Issuer data block
    var blockDataIssuer = await processToAddIssuer(issuerPGP, blockData);
    
    blockDataIssuer.configDateTimeLedger();
    logWrite('[prepareDataToSubmit] BlockData ISSUED as JSON in client application');

    return blockDataIssuer;
}


/**
 * Main program function
 */
async function main() {

    var appArgs = process.argv.slice(2);

    logWrite('[main] appArgs = ', JSON.stringify(appArgs));

    if (appArgs == undefined || appArgs.length < quantArgs) {
        let msg = `You must specify ${quantArgs} arguments in lower case: \"Organization Issuer Name\", \"Wallet Issuer Name\", and \"File Path\"`;
        logWrite(`[main, A] Message: ${msg}`);
        throw msg;
    }

    var organizationName = appArgs[0]; // Organization Name
    var walletName = appArgs[1]; // Name of the user that will send file
    var filePath = appArgs[2]; // File to be send

    if (await assertParams(organizationName, walletName, filePath)) {
        logWrite('[main, B] Parameters Failed to Load');
    }

    var recip = Recipient.newRecipient();
    
    // Get the list of Recipients and their wallets
    var destinationsArray = await recip.getDestinations(dirWallets);
    logWrite('[main] Destination List');
    logWrite(JSON.stringify(destinationsArray));

    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);

    var chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWallets, organizationName, walletName, transactionIssue, contractName, pathOfGatewayConfig);

    var dataToSubmit = await prepareDataToSubmit(dirWallets, organizationName, walletName, filePath, destinationsArray);

    // Write data do filesystem before ISSUE
    if (logActive) { fs.writeFileSync(JsonSubmitToIssue, dataToSubmit.serialize(), utf8); }

    // logWrite('[main] Data to submit in transaction = ' + JSON.stringify(dataToSubmit));

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
     * ============================================================================
     * Under this point the code process the result from ledger processing
     */
    var response = ResponseModel.translateLedgerResponse(txResponse);

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

    var blockDataAfterTx = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    var status = blockDataAfterTx.status;

    logWrite(`[main] Document status = ${status}`);

    if (status != BeanDataBlock.getBlockState().ISSUED) {
        let msgError = `Document must be in ISSUED status to be completed in process`;
        logWrite(`[main, F] Message: ${msgError}`);
        throw msgError;
    }
    
    logWrite(`[main] Document content = ${JSON.stringify(blockDataAfterTx)}`);

    // Write data do filesystem after ISSUE
    fs.writeFileSync(DocJsonIssued, blockDataAfterTx.serialize(), utf8);

    return true;
}


main().then(() => {

    console.log('\n Issue program complete. \n');

}).catch((e) => {

    console.log('\n Issue program exception. \n');
    console.log(e);
    process.exit(-1);

});
