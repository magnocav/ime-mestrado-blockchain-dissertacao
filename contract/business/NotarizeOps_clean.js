#!/usr/bin/env node
'use strict';

const crypto = require('crypto');

const BeanUser = require('../lib/BeanUser.js');
const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');
const EccUtil = require('../lib/CryptoKeyUtil.js');

const hex = BeanTransaction.getHEX();
const sha256 = BeanTransaction.getSHA256();

class NotarizeOps {

    createHash() {
        return crypto.createHash(sha256);
    }

    async validateIssuerBlock(blockData) {

        var issuerOK = await this.verifyIssuer(blockData);

        var recipientsOK = await this.validateIssuerRecipients(blockData);

        var datetimeOK = await this.validateIssuerDateTime(blockData);

        var merkleRootIssuerTest = BeanDataBlock.calculateMerkleRootIssuer(blockData);
        var merkleRootIssuer = blockData.merkleRootIssuer;

        if (merkleRootIssuer != merkleRootIssuerTest) {
            return false;
        }

        let valueToReturn = false;

        if (issuerOK && recipientsOK && datetimeOK) {
            valueToReturn = true;
        }

        return valueToReturn;
    }

    async verifyIssuer(blockData) {

        let issuer = blockData.issuer;
        let hashFromUserInfos = BeanUser.generateHashFromUserInfos(issuer);
        let signatureOfUserInfos = issuer.signatureOfUserInfos;

        var verifyHashIssuer = false;
        verifyHashIssuer = await EccUtil.verifyMessageSigned(hashFromUserInfos, signatureOfUserInfos, issuer);

        if (!verifyHashIssuer) {
            throw 'Dados do Emissor estao incorretos. Chave publica do Emissor nao pode ser validada';
        }

        return verifyHashIssuer;
    }

    async validateIssuerRecipients(blockData) {

        let issuer = blockData.issuer;
        let recipientsHash = blockData.recipientsHash;
        let recipientsHashSignedByIssuer = blockData.recipientsHashSignedByIssuer;

        var verifyHashRecipients = false;
        verifyHashRecipients = await EccUtil.verifyMessageSigned(recipientsHash, recipientsHashSignedByIssuer, issuer);

        if (!verifyHashRecipients) {
            throw 'Dados dos destinatarios estao incorretos. Chave publica do Emissor nao pode ser validada';
        }

        return verifyHashRecipients;
    }

    async validateIssuerDateTime(blockData) {

        let issuer = blockData.issuer;
        let dateTimeIssue = blockData.dateTimeIssue;
        var diffDateOK = false;

        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeIssue, new Date());
        if (!diffDateOK) {
            throw 'Data atual e mais antiga que a data de emissao';
        }

        let hashFactory = this.createHash();
        let dateTimeIssueHash = hashFactory.update(dateTimeIssue.toString()).digest(hex);

        let dateTimeSignedByIssuer = blockData.dateTimeSignedByIssuer;

        var verifyHashDateTimeIssue = false;

        verifyHashDateTimeIssue = await EccUtil.verifyMessageSigned(dateTimeIssueHash, dateTimeSignedByIssuer, issuer);

        if (!verifyHashDateTimeIssue) {
            throw 'Data-hora incorreta. Chave publica do Emissor nao pode ser validada';
        }

        return verifyHashDateTimeIssue;
    }

    async validateValidatorBlock(blockData) {

        let validatorOK = await this.verifyValidator(blockData);
        let recipientsOK = await this.validateValidatorRecipients(blockData);
        let datetimeOK = await this.validateValidatorDateTime(blockData);

        let merkleRootValidatorTest = BeanDataBlock.calculateMerkleRootValidator(blockData);
        let merkleRootValidator = blockData.merkleRootValidator;

        if (merkleRootValidator != merkleRootValidatorTest) {
            return false;
        }

        let valueToReturn = false;

        if (validatorOK && recipientsOK && datetimeOK) {
            valueToReturn = true;
        }

        return valueToReturn;
    }

    async verifyValidator(blockData) {

        let validator = blockData.validator;

        let hashFromUserInfos = BeanUser.generateHashFromUserInfos(validator);
        let signatureOfUserInfos = validator.signatureOfUserInfos;
        let verifyHashValidator = false;

        verifyHashValidator = await EccUtil.verifyMessageSigned(hashFromUserInfos, signatureOfUserInfos, validator);

        if (!verifyHashValidator) {
            throw 'Dados do Validador estao incorretos. Chave publica do Validador nao pode ser validada';
        }

        return verifyHashValidator;
    }

    async validateValidatorRecipients(blockData) {

        let validator = blockData.validator;
        let recipientsHash = blockData.recipientsHash;
        let recipientsHashSignedByValidator = blockData.recipientsHashSignedByValidator;

        let verifyHashRecipients = false;
        verifyHashRecipients = EccUtil.verifyMessageSigned(recipientsHash, recipientsHashSignedByValidator, validator);

        if (!verifyHashRecipients) {
            throw 'Dados dos destinatarios estao incorretos. Chave publica do Validador nao pode ser validada';
        }

        return verifyHashRecipients;
    }

    async validateValidatorDateTime(blockData) {

        let validator = blockData.validator;
        var dateTimeValidate = blockData.dateTimeValidate;
        
        var diffDateOK = false;
        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeValidate, new Date());
        if (!diffDateOK) {
            throw 'Data atual e mais antiga que a data de validaçao';
        }

        let hashFactory = this.createHash();
        let dateTimeValidateHash = hashFactory.update(dateTimeValidate.toString()).digest(hex);
        let dateTimeSignedByValidator = blockData.dateTimeSignedByValidator;
        let verifyHashDateTimeValidate = false;
        verifyHashDateTimeValidate = EccUtil.verifyMessageSigned(dateTimeValidateHash, dateTimeSignedByValidator, validator);

        if (!verifyHashDateTimeValidate) {
            throw 'Data-hora incorreta. Chave publica do Validador nao pode ser validada';
        }
        return verifyHashDateTimeValidate;
    }


    async validateRegistryReader(blockData) {

        let issuerVerify = await this.validateIssuerBlock(blockData);
        if (issuerVerify == false) {
            throw 'Dados do Emissor estao invalidos dentro do bloco';
        }

        let validatedStatus = BeanDataBlock.getBlockState().VALIDATED;
        let revokedStatus = BeanDataBlock.getBlockState().REVOKED;
        var status = blockData.status;

        if ((status == validatedStatus) || (status == revokedStatus)) {

            let validatorVerify = await this.validateValidatorBlock(blockData);
            if (validatorVerify == false) {
                throw 'Dados do Validador estao invalidos dentro do bloco';
            }
        }

        let readerInfo = blockData.reader;
        var reader = BeanUser.createBeanUser(readerInfo);

        let recipientsArray = blockData.recipients;

        let readerNotFound = true;

        for (var i = 0, size = recipientsArray.length; i < size; i++) {

            let recipient = BeanUser.createBeanUser(recipientsArray[i]);

            if ((recipient.publicId == reader.publicId) && (recipient.email == reader.email)) {
                reader.setPassword(recipient.password);
                reader.setInitVector(recipient.initVector);
                i = size;
                readerNotFound = false;
            }
        }

        if (readerNotFound) {
            throw 'Leitor nao esta dentro da lista de destinatarios';
        }

        blockData.setReader(reader);

        return blockData;
    }

    async areEqualBeforeRevoke(blockDataFromCaller, blockDataFromLedger) {

        try {
            let referenceCaller = BeanDataBlock.createBeanDataBlock(blockDataFromCaller);
            let dataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataFromLedger);

            var issuerVerify = await this.validateIssuerBlock(referenceCaller);
            if (issuerVerify == false) {
                throw 'Dados do Emissor invalidos dentro do bloco';
            }

            var statusBeforeRevoke = referenceCaller.status;

            if (statusBeforeRevoke == BeanDataBlock.getBlockState().VALIDATED) {

                var validatorVerify = await this.validateValidatorBlock(referenceCaller);
                if (validatorVerify == false) {
                    throw 'Dados do Validador invalidos dentro do bloco';
                }
            }

            let docsEqual = dataFromLedger.equals(referenceCaller);
            if (!docsEqual) {
                throw 'Os dados do bloco do chamador sao diferentes em relaçao aos dados do bloco do razao';
            }

        } catch (error) {
            return false;
        }

        return true;
    }

}

module.exports = NotarizeOps;
