#!/usr/bin/env node
'use strict';

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
const EccUtil = require('../contract/lib/CryptoKeyUtil.js');

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const base64 = BeanTransaction.getBASE64();
const sha256 = BeanTransaction.getSHA256();
const algoritsymm = 'aes-256-cbc';

const transactionIssue = BeanTransaction.getTxStatus().ISSUE;
const contractName = BeanTransaction.getContractName();

const DocJsonIssued = ClientReference.getDocJsonIssued();

const dirWallets = '../wallet';
const quantArgs = 3;


main().then(() => {

    console.log('\n Programa de emissao completado. \n');

}).catch((e) => {
    console.log('\n Exception ocorrida. \n');
    console.log(e);
    process.exit(-1);
});


async function main() {

    var appArgs = process.argv.slice(2);

    if (appArgs == undefined || appArgs.length < quantArgs) {
        throw (quantArgs + ' argumentos sao obrigatorios');
    }

    var organizationName = appArgs[0]; 
    var walletName = appArgs[1];
    var filePath = appArgs[2];

    await assertParams(organizationName, walletName, filePath);

    var recip = Recipient.newRecipient();
    var destinationsArray = await recip.getDestinations(dirWallets);
    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);

    var chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWallets, organizationName, walletName, transactionIssue, contractName, pathOfGatewayConfig);

    var dataToSubmit = await prepareDataToSubmit(dirWallets, organizationName, walletName, filePath, destinationsArray);

    var txResponse = await chaincodeTx.processBlockchainTransaction(dataToSubmit);

    if (txResponse == null || txResponse == undefined) {
        throw 'A resposta do ledger e Nula ou Indefinida';
    }
    
    var response = ResponseModel.translateLedgerResponse(txResponse);

    if (response.txStatus == ResponseModel.getTxStatusType().FAIL) {
        throw response.txMessage;
    }

    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        throw response.txMessage;
    }
     
    var blockDataJSon = JSON.parse(response.txContent);
    var blockDataAfterTx = BeanDataBlock.createBeanDataBlock(blockDataJSon);
    var status = blockDataAfterTx.status;

    if (status != BeanDataBlock.getBlockState().ISSUED) {
        throw 'Documento deve estar no status ISSUED para o processo ser completado';
    }
    
    fs.writeFileSync(DocJsonIssued, blockDataAfterTx.serialize(), utf8);

    return true;
}


async function assertParams(organizationName, walletName, filePath) {

    let erroFlag = false;

    if (organizationName == undefined || organizationName == null) {
        erroFlag = true;
    }

    if (walletName == undefined || walletName == null) {
        erroFlag = true;
    }

    if (filePath == undefined || filePath == null) {
        erroFlag = true;
    }

    if (erroFlag) {
        throw 'Todos os parametros devem ser preenchidos';
    }
}


function createHash() {
    return crypto.createHash(sha256);
}


async function prepareDataToSubmit(dirWallets, organizationName, walletName, filePath, destinationsArray) {

    var docUtil = ClientUtil.newClientUtil();

    var issuerPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    var pathFile = filePath;

    var fileStat = fs.statSync(pathFile);
    var fileBuff = fs.readFileSync(pathFile);

    const msgFileContentBase64 = Buffer.from(fileBuff).toString(base64);

    let msgHashFactory = createHash();
    var msgHashFileContent = msgHashFactory.update(msgFileContentBase64).digest(hex);
    var msgHashFileSigned = await EccUtil.signMessage(issuerPGP, msgHashFileContent);;

    const password = crypto.randomBytes(32);
    const passwordBase64 = Buffer.from(password).toString(base64);
    const initVector = crypto.randomBytes(16);
    const initVectorBase64 = Buffer.from(initVector).toString(base64);

    function createCipher() {
        return crypto.createCipheriv(algoritsymm, Buffer.from(password), initVector);
    }

    var cipher = createCipher();
    var msgEncrypted = cipher.update(msgFileContentBase64);
    msgEncrypted = Buffer.concat([msgEncrypted, cipher.final()]).toString(hex);

    cipher = createCipher();
    var msgHashFileSignedEncrypted = cipher.update(msgHashFileSigned);
    msgHashFileSignedEncrypted = Buffer.concat([msgHashFileSignedEncrypted, cipher.final()]).toString(hex);

    const msgFileName = path.basename(pathFile);
    cipher = createCipher();
    var msgFileNameEncrypted = cipher.update(msgFileName);
    msgFileNameEncrypted = Buffer.concat([msgFileNameEncrypted, cipher.final()]).toString(hex);

    const msgFileType = mime.getType(pathFile);
    cipher = createCipher();
    var msgFileTypeEncrypted = cipher.update(msgFileType);
    msgFileTypeEncrypted = Buffer.concat([msgFileTypeEncrypted, cipher.final()]).toString(hex);

    const msgFileExtName = path.extname(pathFile);
    cipher = createCipher();
    var msgFileExtNameEncrypted = cipher.update(msgFileExtName);
    msgFileExtNameEncrypted = Buffer.concat([msgFileExtNameEncrypted, cipher.final()]).toString(hex);

    const msgFileSize = fileStat.size.toString();
    cipher = createCipher();
    var msgFileSizeEncrypted = cipher.update(msgFileSize);
    msgFileSizeEncrypted = Buffer.concat([msgFileSizeEncrypted, cipher.final()]).toString(hex);

    var fileMessage = BeanFileMessage.newBeanFileMessage();
    fileMessage.setFileName(msgFileNameEncrypted);
    fileMessage.setFileType(msgFileTypeEncrypted);
    fileMessage.setFileExtName(msgFileExtNameEncrypted);
    fileMessage.setFileSize(msgFileSizeEncrypted);
    fileMessage.setHashSigned(msgHashFileSignedEncrypted);
    fileMessage.setMessage(msgEncrypted);
    fileMessage.setTransportType(BeanFileMessage.getTransport().ENCRYPTED);

    var buffHashDestination = '';

    async function prepareRecipientToAdd(persona) {

        let recipient = BeanUser.createBeanUser(persona);
        buffHashDestination = buffHashDestination + recipient.publicId.toString();

        let pwdEncryptedBase64 = await EccUtil.encryptMessage(issuerPGP, passwordBase64, recipient);
        recipient.setPassword(pwdEncryptedBase64);

        let initVecBase64Encrypted = await EccUtil.encryptMessage(issuerPGP, initVectorBase64, recipient);
        recipient.setInitVector(initVecBase64Encrypted);

        recipient.clearSecurityData();
        return recipient;
    }

    var recipientsArray = new Array(1 + destinationsArray.length);

    var i = 0;
    for (var len = destinationsArray.length; i < len; i++) {
        recipientsArray[i] = await prepareRecipientToAdd(destinationsArray[i]);
    }

    recipientsArray[i] = await prepareRecipientToAdd(issuerPGP);

    let recipientsHashFactory = createHash();
    var recipientsHash = recipientsHashFactory.update(buffHashDestination.toString()).digest(hex);
    var blockData = BeanDataBlock.newBeanDataBlock();

    blockData.setRecipients(recipientsArray);
    blockData.setRecipientsHash(recipientsHash);
    blockData.setFileMessage(fileMessage);

    var blockDataIssuer = await processToAddIssuer(issuerPGP, blockData);
    blockDataIssuer.configDateTimeLedger();

    return blockDataIssuer;
}


async function processToAddIssuer(issuer, blockData) {

    issuer = await BeanUser.generateSignatureOfUserInfos(issuer);

    let recipientsHash = blockData.recipientsHash;

    let recipientsHashSigned = await EccUtil.signMessage(issuer, recipientsHash);
    blockData.setRecipientsHashSignedByIssuer(recipientsHashSigned);

    let dateTimeIssue = new Date();
    blockData.setDateTimeIssue(dateTimeIssue.toISOString());

    let hashFactory = createHash();
    let dateTimeIssueHash = hashFactory.update(blockData.dateTimeIssue).digest(hex);

    let dateTimeSignedByIssuer = await EccUtil.signMessage(issuer, dateTimeIssueHash);

    blockData.setDateTimeSignedByIssuer(dateTimeSignedByIssuer);
    blockData.setStatus(BeanDataBlock.getBlockState().ISSUED);

    let issuerPersona = BeanUser.createBeanUser(issuer);

    issuerPersona.clearSecurityData();

    blockData.setIssuer(issuerPersona);

    let merkleRootIssuer = BeanDataBlock.calculateMerkleRootIssuer(blockData);
    blockData.setMerkleRootIssuer(merkleRootIssuer);

    return blockData;
}
