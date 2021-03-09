#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

// Business logic (well just util but still it's general purpose logic)
const crypto = require('crypto');

const BeanUser = require('../lib/BeanUser.js');
const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');
const CryptoWalletPGPUtil = require('../lib/CryptoWalletPGPUtil.js');
const EccUtil = require('../lib/CryptoKeyUtil.js');

const hex = BeanTransaction.getHEX();
const sha256 = BeanTransaction.getSHA256();

const logPrefix = '\n {NotarizeOps} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * Define smart contract by extending Fabric Contract class
 *
 */
class NotarizeOps {

    /**
     * Creates the hash factory, to later generate a new hash when the text is parameterized.
     */
    createHash() {
        return crypto.createHash(sha256);
    }


    /**
     * 
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async verifyIssuer(blockData) {

        // Informacoes do Issuer
        // Informacoes publicas do Issuer assinadas por ele
        let issuer = blockData.issuer;

        let hashFromUserInfos = BeanUser.generateHashFromUserInfos(issuer);
        logWrite(`[verifyIssuer] hashFromUserInfos: ${hashFromUserInfos}`);

        let signatureOfUserInfos = issuer.signatureOfUserInfos;
        logWrite(`[verifyIssuer] signatureOfUserInfos: ${signatureOfUserInfos} `);

        var verifyHashIssuer = false;
        verifyHashIssuer = await EccUtil.verifyMessageSigned(hashFromUserInfos, signatureOfUserInfos, issuer);

        if (!verifyHashIssuer) {
            let msgError = 'Issuer Data Incorrect. Issuer Publick Key Not Validated';
            logWrite(`[verifyIssuer] Message: ${msgError}`);
            throw msgError;
            // stop here
        }
        // Issuer: OK ---------------------------------------
        logWrite(`[verifyIssuer] Issuer Data Ckecked`);

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

        var verifyHashRecipients = false;
        verifyHashRecipients = await EccUtil.verifyMessageSigned(recipientsHash, recipientsHashSignedByIssuer, issuer);

        if (!verifyHashRecipients) {
            let msgError = 'Recipients Data Incorrect. Issuer Publick Key Not Validated';
            logWrite(`[validateIssuerRecipients] Message: ${msgError}`);
            throw msgError;
            // stop here
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
            logWrite(`[validateIssuerDateTime, A] Message: ${msgError}`);
            throw msgError;
            // stop here
        }

        // A data e hora deve ser assinada pelo Issuer para evitar falsificação
        // Recipient terá que validar essa assinatura
        let hashFactory = this.createHash();
        let dateTimeIssueHash = hashFactory.update(dateTimeIssue.toString()).digest(hex);

        //Data e Hora -> Validar ---------------------------------------
        let dateTimeSignedByIssuer = blockData.dateTimeSignedByIssuer;

        var verifyHashDateTimeIssue = false;

        verifyHashDateTimeIssue = await EccUtil.verifyMessageSigned(dateTimeIssueHash, dateTimeSignedByIssuer, issuer);

        if (!verifyHashDateTimeIssue) {
            let msgError = 'Date-Time Data Incorrect. Issuer Publick Key Not Validated';
            logWrite(`[validateIssuerDateTime, B] Message: ${msgError}`);
            throw msgError;
            // stop here
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
        var issuerOK = await this.verifyIssuer(blockData);
        logWrite('[validateIssuerBlock] issuerOK: ' + issuerOK);

        // Recipients: Validar Dados ---------------------------
        var recipientsOK = await this.validateIssuerRecipients(blockData);
        logWrite('[validateIssuerBlock] recipientsOK: ' + recipientsOK);

        // Date-Time: Validar Dados ---------------------------
        var datetimeOK = await this.validateIssuerDateTime(blockData);
        logWrite('[validateIssuerBlock] datetimeOK: ' + datetimeOK);

        // Issuer Merkle Hash: Validar Dados ---------------------------
        var merkleRootIssuerTest = BeanDataBlock.calculateMerkleRootIssuer(blockData);
        var merkleRootIssuer = blockData.merkleRootIssuer;

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
     * Check if READER is inside Recipients List
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    async validateRegistryReader(blockData) {


        let issuerVerify = await this.validateIssuerBlock(blockData);
        if (issuerVerify == false) {
            let msgError = 'Issuer data is invalid inside block';
            logWrite(`[validateRegistryReader, A] Message: ${msgError}`);
            throw msgError;
            //stop here;
        }
        logWrite('[validateRegistryReader] Issuer data is valid inside block');

        let validatedStatus = BeanDataBlock.getBlockState().VALIDATED;
        let revokedStatus = BeanDataBlock.getBlockState().REVOKED;

        var status = blockData.status;

        if ((status == validatedStatus) || (status == revokedStatus)) {

            let validatorVerify = await this.validateValidatorBlock(blockData);
            if (validatorVerify == false) {
                let msgError = 'Validator data is invalid inside block';
                logWrite(`[validateRegistryReader, B] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }
            logWrite('[validateRegistryReader] Validator data is valid inside block');
        }

        // Recupera objeto que encapsula informações do Reader
        // Separa o objeto do READER do restante do bloco
        let readerInfo = blockData.reader;
        var reader = BeanUser.createBeanUser(readerInfo);

        let recipientsArray = blockData.recipients;

        let readerNotFound = true;

        for (var i = 0, size = recipientsArray.length; i < size; i++) {

            // Obter usuario Recipient
            let recipient = BeanUser.createBeanUser(recipientsArray[i]);

            // Verifica se o Reader encontra-se no array
            if ((recipient.publicId == reader.publicId) && (recipient.email == reader.email)) {

                // Encontrou o READER
                // Então adiciona no READER as informações para DESCRIPTOGRAFIA
                reader.setPassword(recipient.password);
                reader.setInitVector(recipient.initVector);

                i = size;
                readerNotFound = false;
            }
        }

        if (readerNotFound) {
            let msgError = 'Reader is not in the Recipients List';
            logWrite(`[validateRegistryReader, C] Message: ${msgError}`);
            throw msgError;
            // stop here
        }

        // Retorna com o READER para o bloco de dados
        blockData.setReader(reader);

        logWrite('[validateRegistryReader] Reader Is Inside Recipients List');

        return blockData;
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
        logWrite('[verifyValidator] hashFromUserInfos: ' + hashFromUserInfos);

        let signatureOfUserInfos = validator.signatureOfUserInfos;
        logWrite('[verifyValidator] signatureOfUserInfos: ' + signatureOfUserInfos);

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

        var dateTimeValidate = blockData.dateTimeValidate;

        var diffDateOK = false;

        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeValidate, new Date());
        if (!diffDateOK) {
            let msgError = 'Actual date is lower than validated date';
            logWrite(`[validateValidatorDateTime, A] Message: ${msgError}`);
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
            logWrite(`[validateValidatorDateTime, B] Message: ${msgError}`);
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
        logWrite('[validateValidatorBlock] validatorOK: ' + validatorOK);

        // Recipients: Validar Dados ---------------------------
        let recipientsOK = await this.validateValidatorRecipients(blockData);
        logWrite('[validateValidatorBlock] recipientsOK: ' + recipientsOK);

        // Date-Time: Validar Dados ---------------------------
        let datetimeOK = await this.validateValidatorDateTime(blockData);
        logWrite('[validateValidatorBlock] datetimeOK: ' + datetimeOK);

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


    /**
     * 
     * @param {*} blockDataFromCaller 
     * @param {*} blockDataFromLedger 
     */
    async areEqualBeforeRevoke(blockDataFromCaller, blockDataFromLedger) {

        try {
            // Verify situation from caller
            let referenceCaller = BeanDataBlock.createBeanDataBlock(blockDataFromCaller);
            let dataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataFromLedger);

            // Validate Issuer Data
            var issuerVerify = await this.validateIssuerBlock(referenceCaller);
            if (issuerVerify == false) {
                let msgError = 'Issuer data is invalid inside block';
                logWrite(`[areEqualBeforeRevoke, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }
            logWrite(`[areEqualBeforeRevoke] Issuer data is valid inside block`);

            var statusBeforeRevoke = referenceCaller.status;

            if (statusBeforeRevoke == BeanDataBlock.getBlockState().VALIDATED) {
                // Validate Validator Data
                var validatorVerify = await this.validateValidatorBlock(referenceCaller);
                if (validatorVerify == false) {
                    let msgError = 'Validator data is invalid inside block';
                    logWrite(`[areEqualBeforeRevoke, B] Message: ${msgError}`);
                    throw msgError;
                    //stop here;
                }
                logWrite(`[areEqualBeforeRevoke] Validtor data is valid inside block`);
            }

            logWrite(`[areEqualBeforeRevoke] Document status is: ${statusBeforeRevoke}, with key: ${referenceCaller.key}`);

            let docsEqual = dataFromLedger.equals(referenceCaller);
            if (!docsEqual) {
                let msgError = `The block data from caller is different in relation to block data from ledger`;
                logWrite(`[areEqualBeforeRevoke, C] Ledger processing warning: ${msgError}`);
                throw msgError;
            }

        } catch (error) {
            logWrite(`[areEqualBeforeRevoke, D] The two documents are different: ${error}`);
            logWrite(error.stack)
            return false;
        }

        return true;
    }

}

module.exports = NotarizeOps;
