#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const BeanUser = require('../contract/lib/BeanUser.js');
const BeanDataBlock = require('../contract/lib/BeanDataBlock.js');
const BeanTransaction = require('../contract/lib/BeanTransaction.js');
const CryptoWalletPGPUtil = require('../contract/lib/CryptoWalletPGPUtil.js');
const EccUtil = require('../contract/lib/CryptoKeyUtil.js');

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const sha256 = BeanTransaction.getSHA256();
const algoritsymm = BeanTransaction.getALGORITSYMM();

class ClientUtil {

    static newClientUtil() {
        return new ClientUtil();
    }

    createHash() {
        return crypto.createHash(sha256);
    }

    async getDocumentKey(jsonFile) {

        let fileBlockData = fs.readFileSync(jsonFile, utf8);

        if (fileBlockData == undefined || fileBlockData === null) {
            throw 'Impossivel ler arquivo: ' + jsonFile;
        }

        let blockDataJSon = JSON.parse(fileBlockData);
        let blockData = BeanDataBlock.createBeanDataBlock(blockDataJSon);
        let docKey = blockData.getKey();
        return docKey;
    }

    async getUserWalletPGP(dirWallets, organizationName, walletName) {

        var personaUtil = CryptoWalletPGPUtil.newCryptoWalletPGPUtil();
        var personaWallet = await personaUtil.configPGPWallet(dirWallets, organizationName, walletName);
        var persona = BeanUser.createBeanUser(personaWallet);
        persona = await BeanUser.generateSignatureOfUserInfos(persona);

        return persona;
    }

    async processDecryptSave(blockDataRetrieved) {

        let status = blockDataRetrieved.status;
        var issuerVerify = await this.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            throw 'Dados do Emissor sao invalidos';
        }

        if (status != BeanDataBlock.getBlockState().ISSUED){
            let validatorVerify = await this.validateValidatorBlock(blockDataRetrieved);
            if (validatorVerify == false){
                throw 'Dados do Validador sao invalidos';
            }
        }

        let reader = blockDataRetrieved.reader;

        var fileMessage = blockDataRetrieved.fileMessage;

        var passwordBase64 = await EccUtil.decryptMessage(reader, reader.password);
        var password = EccUtil.base64Decode(passwordBase64);

        var initVectorBase64 = await EccUtil.decryptMessage(reader, reader.initVector);
        var initVector = EccUtil.base64Decode(initVectorBase64);

        function createDecipher() {
            return crypto.createDecipheriv(algoritsymm, Buffer.from(password), initVector);
        }

        var decipher = createDecipher();
        var msgEncrypted = Buffer.from(fileMessage.message, hex);
        var msgFileContentBase64 = decipher.update(msgEncrypted);
        msgFileContentBase64 = Buffer.concat([msgFileContentBase64, decipher.final()]);

        decipher = createDecipher();
        var msgHashFileSignedEncrypted = Buffer.from(fileMessage.hashSigned, hex);
        var msgHashFileSigned = decipher.update(msgHashFileSignedEncrypted);
        msgHashFileSigned = Buffer.concat([msgHashFileSigned, decipher.final()]);

        decipher = createDecipher();
        var msgFileSizeEncrypted = Buffer.from(fileMessage.fileSize, hex);
        var msgFileSize = decipher.update(msgFileSizeEncrypted);
        msgFileSize = Buffer.concat([msgFileSize, decipher.final()]);

        decipher = createDecipher();
        var msgFileExtNameEncrypted = Buffer.from(fileMessage.fileExtName, hex);
        var msgFileExtName = decipher.update(msgFileExtNameEncrypted);
        msgFileExtName = Buffer.concat([msgFileExtName, decipher.final()]);

        decipher = createDecipher();
        var msgFileTypeEncrypted = Buffer.from(fileMessage.fileType, hex);
        var msgFileType = decipher.update(msgFileTypeEncrypted);
        msgFileType = Buffer.concat([msgFileType, decipher.final()]);

        decipher = createDecipher();
        var msgFileNameEncrypted = Buffer.from(fileMessage.fileName, hex);
        var msgFileName = decipher.update(msgFileNameEncrypted);
        msgFileName = Buffer.concat([msgFileName, decipher.final()]);

        var actualDate = new Date();
        actualDate = actualDate.toISOString();
        actualDate = actualDate.replace(/:/g, '-');

        var customFileName = `${actualDate}-${msgFileName}`;

        var fileContentBinary = EccUtil.base64Decode(msgFileContentBase64.toString(utf8));

        fs.writeFileSync('./' + customFileName, fileContentBinary);

        return true;
    }

    async validateIssuerBlock(blockData) {

        let issuerOK = await this.verifyIssuer(blockData);

        let recipientsOK = await this.validateIssuerRecipients(blockData);

        let datetimeOK = await this.validateIssuerDateTime(blockData);

        let merkleRootIssuerTest = BeanDataBlock.calculateMerkleRootIssuer(blockData);
        let merkleRootIssuer = blockData.merkleRootIssuer;

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

        let verifyHashIssuer = false;
        verifyHashIssuer = await EccUtil.verifyMessageSigned(hashFromUserInfos, signatureOfUserInfos, issuer);

        if (!verifyHashIssuer) {
            throw 'Dados do Emissor sao incorretos';
        }

        return verifyHashIssuer;
    }


    async validateIssuerRecipients(blockData) {

        let issuer = blockData.issuer;

        let recipientsHash = blockData.recipientsHash;

        let recipientsHashSignedByIssuer = blockData.recipientsHashSignedByIssuer;

        let verifyHashRecipients = false;
        verifyHashRecipients = await EccUtil.verifyMessageSigned(recipientsHash, recipientsHashSignedByIssuer, issuer);

        if (!verifyHashRecipients) {
            throw 'Dados dos destinatarios sao incorretos. Chave do Emissor nao validada';
        }

        return verifyHashRecipients;
    }


    async validateIssuerDateTime(blockData) {

        let issuer = blockData.issuer;
        let dateTimeIssue = blockData.dateTimeIssue;
        var diffDateOK = false;

        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeIssue, new Date());
        if (!diffDateOK) {
            throw 'Data atual é mais antiga que a data de emissao';
        }

        let hashFactory = this.createHash();
        let dateTimeIssueHash = hashFactory.update(dateTimeIssue.toString()).digest(hex);

        let dateTimeSignedByIssuer = blockData.dateTimeSignedByIssuer;

        let verifyHashDateTimeIssue = false;
        verifyHashDateTimeIssue = await EccUtil.verifyMessageSigned(dateTimeIssueHash, dateTimeSignedByIssuer, issuer);

        if (!verifyHashDateTimeIssue) {
            throw 'Data-hora é incorreta. Chave do Emissor nao validada';
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
            throw 'Dados do Validador sao incorretos';
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
            throw 'Dados dos destinatarios sao incorretos. Chave do Validador nao validada';;
        }

        return verifyHashRecipients;
    }


    async validateValidatorDateTime(blockData) {

        let validator = blockData.validator;

        let dateTimeValidate = blockData.dateTimeValidate;

        var diffDateOK = false;

        diffDateOK = EccUtil.isBeginDateLowerEndDate(dateTimeValidate, new Date());
        if (!diffDateOK) {
            throw 'Data atual é mais antiga que a data de validacao';
        }

        let hashFactory = this.createHash();
        let dateTimeValidateHash = hashFactory.update(dateTimeValidate.toString()).digest(hex);

        let dateTimeSignedByValidator = blockData.dateTimeSignedByValidator;

        let verifyHashDateTimeValidate = false;
        verifyHashDateTimeValidate = EccUtil.verifyMessageSigned(dateTimeValidateHash, dateTimeSignedByValidator, validator);

        if (!verifyHashDateTimeValidate) {
            throw 'Data-hora incorreta. Chave do Validador nao validada';
        }

        return verifyHashDateTimeValidate;
    }




}

module.exports = ClientUtil;