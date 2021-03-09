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

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const base64 = BeanTransaction.getBASE64();
const sha256 = BeanTransaction.getSHA256();
const algoritsymm = BeanTransaction.getALGORITSYMM();

const DocJsonRead = ClientReference.getDocJsonRead();
const FileBase64ReadAfterDecrypt = ClientReference.getFileBase64ReadAfterDecrypt();

const logPrefix = '\n {ClientUtil} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * 
 */
class ClientUtil {


    /**
     * 
     */
    static newClientUtil() {
        return new ClientUtil();
    }

    /**
     * Creates the hash factory, to later generate a new hash when the text is parameterized.
     */
    createHash() {
        return crypto.createHash(sha256);
    }

    /**
     * 
     * @param {*} jsonFile 
     */
    async getDocumentKey(jsonFile) {

        logWrite(`[getDocumentKey] path file to load: ${jsonFile}`);

        let fileBlockData = fs.readFileSync(jsonFile, utf8);

        if (fileBlockData == undefined || fileBlockData === null) {
            let msgError = `Impossible to load file: ${pathFile}`;
            logWrite(`[getDocumentKey] Message: ${msgError}`);
            throw msgError;
            // stop here
        }

        logWrite(`[getDocumentKey] document: ${fileBlockData}`);

        let blockDataJSon = JSON.parse(fileBlockData);

        let blockData = BeanDataBlock.createBeanDataBlock(blockDataJSon);

        let status = blockData.status;

        logWrite(`[getDocumentKey] status: ${status}`);

        let docKey = blockData.getKey();
        logWrite(`[getDocumentKey] document key: ${docKey}`);

        return docKey;
    }


    /**
     * 
     * @param {*} dirWallets 
     * @param {*} organizationName 
     * @param {*} walletName 
     */
    async getUserWalletPGP(dirWallets, organizationName, walletName) {

        var personaUtil = CryptoWalletPGPUtil.newCryptoWalletPGPUtil();
        // Get sender user
        var personaWallet = await personaUtil.configPGPWallet(dirWallets, organizationName, walletName);
        logWrite('[getUserWalletPGP] Reader Wallet: ' + personaWallet);

        // Create object that encapsulates sender information
        var persona = BeanUser.createBeanUser(personaWallet);
        logWrite('[getUserWalletPGP] Reader: ' + persona.serialize());

        persona = await BeanUser.generateSignatureOfUserInfos(persona);

        return persona;
    }

    
    /**
     * 
     * @param {*} blockDataRetrieved 
     */
    async processDecryptSave(blockDataRetrieved) {

        let status = blockDataRetrieved.status;

        // Validate Issuer Data
        var issuerVerify = await this.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            let msgError = 'Issuer data is invalid inside block';
            logWrite(`[processDecryptSave] Issue Validation Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        logWrite('[processDecryptSave] Issuer data is valid inside block');

        if (status != BeanDataBlock.getBlockState().ISSUED){

            // Validate Validator Data
            let validatorVerify = await this.validateValidatorBlock(blockDataRetrieved);
            if (validatorVerify == false){
                let msgError = 'Validator data is invalid inside block';
                logWrite(`[processDecryptSave] Validate Validation Message: ${msgError}`);
                throw msgError;
                //stop here;
            }
            logWrite('[processDecryptSave] Validator data is valid inside block')
        }

        // Retrieve the Reader infos
        let reader = blockDataRetrieved.reader;

        /*
        let recipientsArray = blockDataRetrieved.recipients;

        let readerNotFound = true;

        for (var i = 0, len = recipientsArray.length; i < len; i++) {

            // Obter usuario Recipient
            let recipient = BeanUser.createBeanUser(recipientsArray[i]);

            // Verifica se o Reader encontra-se no array
            if ((recipient.publicId == reader.publicId) && (recipient.email == reader.email)) {

                reader.setPassword(recipient.password);
                reader.setInitVector(recipient.initVector);

                i = len;
                readerNotFound = false;
            }
        }

        if (readerNotFound) {
            let msgError = 'Reader is not in the set of recipients list';
            logWrite(`[processDecryptSave] Message: ${msgError}`);
            throw msgError;
            // stop here
        }
        

        logWrite('[processDecryptSave] Reader is inside recipients list');
        */

        logWrite(`[processDecryptSave] File path: DocJsonRead >> ${DocJsonRead}`);
        logWrite(`[processDecryptSave] Content in File: DocJsonRead >> ${blockDataRetrieved.stringify()}`);

        // Write encrypted document to filesystem
        if (logActive) { fs.writeFileSync(DocJsonRead, blockDataRetrieved.serialize(), utf8); }

        // Decrypt the file with the symmetric password
        // Decrypt message with AES

        var fileMessage = blockDataRetrieved.fileMessage;

        // logWrite('[processDecryptSave] reader.password: ' + reader.password);
        // logWrite('[processDecryptSave] reader.initVector: ' + reader.initVector);

        var passwordBase64 = await EccUtil.decryptMessage(reader, reader.password);
        // logWrite('[processDecryptSave] passwordBase64: ' + passwordBase64);

        var password = EccUtil.base64Decode(passwordBase64);
        logWrite('[processDecryptSave] password Decode');

        var initVectorBase64 = await EccUtil.decryptMessage(reader, reader.initVector);
        // logWrite('[processDecryptSave] initVectorBase64: ' + initVectorBase64);

        var initVector = EccUtil.base64Decode(initVectorBase64);
        logWrite('[processDecryptSave] initVector Decode');

        /**
         * Create the decryptor with AES algorithm
         */
        function createDecipher() {
            return crypto.createDecipheriv(algoritsymm, Buffer.from(password), initVector);
        }

        var decipher = createDecipher();
        var msgEncrypted = Buffer.from(fileMessage.message, hex);
        var msgFileContentBase64 = decipher.update(msgEncrypted);
        msgFileContentBase64 = Buffer.concat([msgFileContentBase64, decipher.final()]);

        // Testing what was decrypted as file content
        if (logActive) fs.writeFileSync(FileBase64ReadAfterDecrypt, msgFileContentBase64.toString(), utf8);

        // Decrypt the message hash that was signed by Issuer
        decipher = createDecipher();
        var msgHashFileSignedEncrypted = Buffer.from(fileMessage.hashSigned, hex);
        var msgHashFileSigned = decipher.update(msgHashFileSignedEncrypted);
        msgHashFileSigned = Buffer.concat([msgHashFileSigned, decipher.final()]);
        // logWrite('[processDecryptSave] msgHashFileSigned: ' + msgHashFileSigned);

        // Decrypt message metadata
        decipher = createDecipher();
        var msgFileSizeEncrypted = Buffer.from(fileMessage.fileSize, hex);
        var msgFileSize = decipher.update(msgFileSizeEncrypted);
        msgFileSize = Buffer.concat([msgFileSize, decipher.final()]);
        logWrite('[processDecryptSave] msgFileSize: ' + msgFileSize);

        decipher = createDecipher();
        var msgFileExtNameEncrypted = Buffer.from(fileMessage.fileExtName, hex);
        var msgFileExtName = decipher.update(msgFileExtNameEncrypted);
        msgFileExtName = Buffer.concat([msgFileExtName, decipher.final()]);
        logWrite('[processDecryptSave] msgFileExtName: ' + msgFileExtName);

        decipher = createDecipher();
        var msgFileTypeEncrypted = Buffer.from(fileMessage.fileType, hex);
        var msgFileType = decipher.update(msgFileTypeEncrypted);
        msgFileType = Buffer.concat([msgFileType, decipher.final()]);
        logWrite('[processDecryptSave] msgFileType: ' + msgFileType);

        decipher = createDecipher();
        var msgFileNameEncrypted = Buffer.from(fileMessage.fileName, hex);
        var msgFileName = decipher.update(msgFileNameEncrypted);
        msgFileName = Buffer.concat([msgFileName, decipher.final()]);
        logWrite('[processDecryptSave] msgFileName: ' + msgFileName);

        // --------------------------------------------------------------------------------
        // Prepares the file name to serialize the binary in the filesystem
        var actualDate = new Date();
        actualDate = actualDate.toISOString();
        actualDate = actualDate.replace(/:/g, '-');

        // Customizes the file name prefix
        var customFileName = `${actualDate}-${msgFileName}`;

        // --------------------------------------------------------------------------------
        // Prepare content to serialize the binary in the filesystem

        // If you stop configuring the "msgFileContentBase64" Buffer as utf8, the decode does not understand and does not translate the data
        var fileContentBinary = EccUtil.base64Decode(msgFileContentBase64.toString(utf8));

        // Content size in bytes
        logWrite('[processDecryptSave] fileContent.length: ' + fileContentBinary.length);

        // Writes the file in the filesystem
        fs.writeFileSync('./' + customFileName, fileContentBinary);

        logWrite('[processDecryptSave] File Content Written to: ' + customFileName);

        return true;

    }

    /**
     * 
     * @param {BeanDataBlock} blockData 
     */
    async verifyIssuer(blockData) {

        // Issuer information
        // Issuer public information signed by him or her
        let issuer = blockData.issuer;

        let hashFromUserInfos = BeanUser.generateHashFromUserInfos(issuer);
        // logWrite('[verifyIssuer] hashFromUserInfos: ' + hashFromUserInfos);

        let signatureOfUserInfos = issuer.signatureOfUserInfos;
        // logWrite('[verifyIssuer] signatureOfUserInfos: ' + signatureOfUserInfos);

        let verifyHashIssuer = false;
        verifyHashIssuer = await EccUtil.verifyMessageSigned(hashFromUserInfos, signatureOfUserInfos, issuer);

        if (!verifyHashIssuer) {
            let msgError = 'Issuer Data Incorrect. Issuer Publick Key Not Validated';
            logWrite(`[verifyIssuer] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        // Issuer: OK ---------------------------------------
        logWrite('[verifyIssuer] Issuer Data Ckecked');

        return verifyHashIssuer;
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async validateIssuerRecipients(blockData) {

        let issuer = blockData.issuer;

        let recipientsHash = blockData.recipientsHash;

        let recipientsHashSignedByIssuer = blockData.recipientsHashSignedByIssuer;

        let verifyHashRecipients = false;
        verifyHashRecipients = await EccUtil.verifyMessageSigned(recipientsHash, recipientsHashSignedByIssuer, issuer);

        if (!verifyHashRecipients) {
            let msgError = 'Recipients Data Incorrect. Issuer Publick Key Not Validated';
            logWrite(`[validateIssuerRecipients] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        // Recipients: OK ---------------------------------------
        logWrite('[validateIssuerRecipients] Recipients Data Ckecked');

        return verifyHashRecipients;
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async validateIssuerDateTime(blockData) {

        let issuer = blockData.issuer;

        let dateTimeIssue = blockData.dateTimeIssue;

        var diffDateOK = false;

        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeIssue, new Date());
        if (!diffDateOK) {
            let msgError = 'Actual date is lower than issued date';
            logWrite(`[validateIssuerDateTime] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }

        // The date and time must be signed by Issuer to avoid counterfeiting
        // Recipient will have to validate this signature
        let hashFactory = this.createHash();
        let dateTimeIssueHash = hashFactory.update(dateTimeIssue.toString()).digest(hex);

        let dateTimeSignedByIssuer = blockData.dateTimeSignedByIssuer;

        let verifyHashDateTimeIssue = false;
        verifyHashDateTimeIssue = await EccUtil.verifyMessageSigned(dateTimeIssueHash, dateTimeSignedByIssuer, issuer);

        if (!verifyHashDateTimeIssue) {
            let msgError = 'Date-Time Data Incorrect. Issuer Publick Key Not Validated';
            logWrite(`[validateIssuerDateTime] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        // Date-Time: OK ---------------------------------------
        logWrite('[validateIssuerDateTime] Date-Time Data Ckecked');

        return verifyHashDateTimeIssue;
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information. 
     */
    async validateIssuerBlock(blockData) {

        // Issuer: Validar Dados ---------------------------
        let issuerOK = await this.verifyIssuer(blockData);
        // logWrite('[validateIssuerBlock] issuerOK: ' + issuerOK);

        // Recipients: Validar Dados ---------------------------
        let recipientsOK = await this.validateIssuerRecipients(blockData);
        // logWrite('[validateIssuerBlock] recipientsOK: ' + recipientsOK);

        // Date-Time: Validar Dados ---------------------------
        let datetimeOK = await this.validateIssuerDateTime(blockData);
        // logWrite('[validateIssuerBlock] datetimeOK: ' + datetimeOK);

        // Issuer Merkle Hash: Validar Dados ---------------------------
        let merkleRootIssuerTest = BeanDataBlock.calculateMerkleRootIssuer(blockData);
        let merkleRootIssuer = blockData.merkleRootIssuer;

        if (merkleRootIssuer != merkleRootIssuerTest) {
            logWrite('[validateIssuerBlock] Issuer Merkle Root Hash Invalid');
            return false;
            // stop here
        }
        logWrite('[validateIssuerBlock] Issuer Merkle Root Hash Is Valid');

        let valueToReturn = false;

        if (issuerOK && recipientsOK && datetimeOK) {
            valueToReturn = true;
        }

        return valueToReturn;
    }

    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async verifyValidator(blockData) {

        // Informacoes do Validator
        // Informacoes publicas do Validator assinadas por ele
        let validator = blockData.validator;

        let hashFromUserInfos = BeanUser.generateHashFromUserInfos(validator);
        // logWrite('[verifyValidator] hashFromUserInfos: ' + hashFromUserInfos);

        let signatureOfUserInfos = validator.signatureOfUserInfos;
        // logWrite('[verifyValidator] signatureOfUserInfos: ' + signatureOfUserInfos);

        let verifyHashValidator = false;
        verifyHashValidator = await EccUtil.verifyMessageSigned(hashFromUserInfos, signatureOfUserInfos, validator);

        if (!verifyHashValidator) {
            let msgError = 'Validator Data Incorrect. Validator Publick Key Not Validated';
            logWrite(`[verifyValidator] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        // Validator: OK ---------------------------------------
        logWrite('[verifyValidator] Validator Data Ckecked');

        return verifyHashValidator;
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async validateValidatorRecipients(blockData) {

        let validator = blockData.validator;

        let recipientsHash = blockData.recipientsHash;

        let recipientsHashSignedByValidator = blockData.recipientsHashSignedByValidator;

        let verifyHashRecipients = false;
        verifyHashRecipients = EccUtil.verifyMessageSigned(recipientsHash, recipientsHashSignedByValidator, validator);

        if (!verifyHashRecipients) {
            let msgError = 'Recipients Data Incorrect. Validator Publick Key Not Validated';
            logWrite(`[validateValidatorRecipients] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        // Recipients: OK ---------------------------------------
        logWrite('[validateValidatorRecipients] Recipients Data Ckecked');
        return verifyHashRecipients;
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async validateValidatorDateTime(blockData) {

        let validator = blockData.validator;

        let dateTimeValidate = blockData.dateTimeValidate;

        var diffDateOK = false;

        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeValidate, new Date());
        if (!diffDateOK) {
            let msgError = 'Actual date is lower than validated date';
            logWrite(`[validateValidatorDateTime] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }

        // A data e hora deve ser assinada pelo Validator para evitar falsificação
        // Recipient terá que validar essa assinatura
        let hashFactory = this.createHash();
        let dateTimeValidateHash = hashFactory.update(dateTimeValidate.toString()).digest(hex);

        //Data e Hora -> Validar ---------------------------------------
        let dateTimeSignedByValidator = blockData.dateTimeSignedByValidator;

        let verifyHashDateTimeValidate = false;
        verifyHashDateTimeValidate = EccUtil.verifyMessageSigned(dateTimeValidateHash, dateTimeSignedByValidator, validator);

        if (!verifyHashDateTimeValidate) {
            let msgError = 'Date-Time Data Incorrect. Validator Publick Key Not Validated';
            logWrite(`[validateValidatorDateTime] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        // Date-Time: OK ---------------------------------------
        logWrite('[validateValidatorDateTime] Date-Time Data Ckecked');

        return verifyHashDateTimeValidate;
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async validateValidatorBlock(blockData) {

        // Validator: Validar Dados ---------------------------
        let validatorOK = await this.verifyValidator(blockData);
        // logWrite('[validateValidatorBlock] validatorOK: ' + validatorOK);

        // Recipients: Validar Dados ---------------------------
        let recipientsOK = await this.validateValidatorRecipients(blockData);
        // logWrite('[validateValidatorBlock] recipientsOK: ' + recipientsOK);

        // Date-Time: Validar Dados ---------------------------
        let datetimeOK = await this.validateValidatorDateTime(blockData);
        // logWrite('[validateValidatorBlock] datetimeOK: ' + datetimeOK);

        // Validator Merkle Hash: Validar Dados ---------------------------
        let merkleRootValidatorTest = BeanDataBlock.calculateMerkleRootValidator(blockData);
        let merkleRootValidator = blockData.merkleRootValidator;

        if (merkleRootValidator != merkleRootValidatorTest) {
            logWrite('[validateValidatorBlock] Validator Merkle Root Hash Invalid');
            return false;
            // stop here
        }
        logWrite('[validateValidatorBlock] Validator Merkle Root Hash Is Valid');

        let valueToReturn = false;

        if (validatorOK && recipientsOK && datetimeOK) {
            valueToReturn = true;
        }

        return valueToReturn;
    }

}

module.exports = ClientUtil;