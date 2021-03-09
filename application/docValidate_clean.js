#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const BeanUser = require('../contract/lib/BeanUser.js');
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
const transactionValidate = BeanTransaction.getTxStatus().VALIDATE;
const contractName = BeanTransaction.getContractName();

const DocJsonIssued = ClientReference.getDocJsonIssued();
const DocJsonValidated = ClientReference.getDocJsonValidated();

const dirWallets = '../wallet';
const quantArgs = 2;


main().then(() => {

    console.log('\n Programa de validacao completado. \n');

}).catch((e) => {
    console.log('\n Exception ocorrida. \n');
    console.log(e);
    process.exit(-1);
});


async function main() {

    var fileFromReference = DocJsonIssued;

    var appArgs = process.argv.slice(2);

    if (appArgs == undefined || appArgs.length < quantArgs){
        throw (quantArgs + ' argumentos sao obrigatorios');
    }

    var organizationName = appArgs[0];
    var walletName = appArgs[1]; 

    await assertParams(organizationName, walletName);

    var docUtil = ClientUtil.newClientUtil();
    var documentKey = await docUtil.getDocumentKey(fileFromReference);
    var validatorPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    var chaincodeTxRetrieve = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionRetrieve, contractName);    
    var blockDataRetrieved = await retrieveDocument(chaincodeTxRetrieve, documentKey, validatorPGP);

    var statusBefore = blockDataRetrieved.status;

    if (statusBefore == BeanDataBlock.getBlockState().ISSUED){
        var issuerVerify = await docUtil.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            throw 'Dados do Emissor invalidos dentro do bloco';
        }
    } else {
        throw 'O documento foi validado ou revogado antes por outro processamento';
    }

    var issuerRetrieved = blockDataRetrieved.issuer;

    if (validatorPGP.publicId == issuerRetrieved.publicId){
        throw 'O validador deve ser diferente do emissor no processo do documento';
    }

    var chaincodeTxValidate = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionValidate, contractName);  
    var blockDataValidated = await validateDocument(chaincodeTxValidate, validatorPGP, blockDataRetrieved);
    var statusAfter = blockDataValidated.status;

    if (statusAfter != BeanDataBlock.getBlockState().VALIDATED){
        throw 'O documento deve estar no status validado para ser concluido no processo';
    }

    fs.writeFileSync(DocJsonValidated, blockDataValidated.serialize(), utf8);

    return true;  
}


async function assertParams(organizationName, walletName){

    let erroFlag = false;

    if (organizationName == undefined || organizationName == null) {
        erroFlag = true;
    }

    if (walletName == undefined || walletName == null) {
        erroFlag = true;
    }

    if (erroFlag){
        throw 'Todos os parametros devem ser preenchidos';
    }
}


function createHash() {
    return crypto.createHash(sha256);
}


async function prepareChaincodeClientTx(dirWalletsTx, organizationName, walletName, transaction, contractName) {

    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);
    
    let chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWalletsTx, organizationName, walletName, transaction, contractName, pathOfGatewayConfig);

    return chaincodeTx;
}


async function retrieveDocument(chaincodeTxRetrieve, documentKey, validator){
    
    let persona = BeanUser.createBeanUser(validator);
    persona.clearSecurityData();

    var dataToSubmit = BeanDataBlock.newBeanDataBlock();

    dataToSubmit.setReader(persona);
    dataToSubmit.setKey(documentKey);

    var txResponse = await chaincodeTxRetrieve.processBlockchainTransaction(dataToSubmit);

    if (txResponse == null || txResponse == undefined) {
        let msgError = `A resposta do ledger e Nula ou Indefinida`;
        throw msgError;
    }

    var response = ResponseModel.translateLedgerResponse(txResponse);

    if (response.txStatus == ResponseModel.getTxStatusType().FAIL){
        throw response.txMessage;
    }

    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        throw response.txMessage;
    }

    var blockDataJSon = JSON.parse(response.txContent);    
    var blockDataAfterRetrieve = BeanDataBlock.createBeanDataBlock(blockDataJSon);

    var status = blockDataAfterRetrieve.status;

    return blockDataAfterRetrieve;
}


async function validateDocument(chaincodeTxValidate, validator, blockData){
    
    var blockDataValidator = await processToAddValidator(validator, blockData);
    blockDataValidator.configDateTimeLedger();

    var txResponse = await chaincodeTxValidate.processBlockchainTransaction(blockDataValidator);
    
    if (txResponse == null || txResponse == undefined) {
        throw 'A resposta do ledger e Nula ou Indefinida';
    }

    var response = ResponseModel.translateLedgerResponse(txResponse);

    if (response.txStatus == ResponseModel.getTxStatusType().FAIL){
        throw response.txMessage;
    }

    if (response.txStatus == ResponseModel.getTxStatusType().EMPTY) {
        throw response.txMessage;
    }

    var blockDataJSon = JSON.parse(response.txContent);
    var blockDataAfterValidated = BeanDataBlock.createBeanDataBlock(blockDataJSon);
    var status = blockDataAfterValidated.status;

    return blockDataAfterValidated;
}


async function processToAddValidator(validator, blockData) {

    validator = await BeanUser.generateSignatureOfUserInfos(validator);

    let recipientsHash = blockData.recipientsHash;

    let recipientsHashSigned = await EccUtil.signMessage(validator, recipientsHash);
    blockData.setRecipientsHashSignedByValidator(recipientsHashSigned);

    let dateTimeValidate = new Date();
    blockData.setDateTimeValidate(dateTimeValidate.toISOString());

    let hashFactory = createHash();
    let dateTimeValidateHash = hashFactory.update(blockData.dateTimeValidate).digest(hex);

    let dateTimeSignedByValidator = await EccUtil.signMessage(validator, dateTimeValidateHash);

    blockData.setDateTimeSignedByValidator(dateTimeSignedByValidator);

    blockData.setStatus(BeanDataBlock.getBlockState().VALIDATED);

    let validatorPersona = BeanUser.createBeanUser(validator);
    
    validatorPersona.clearSecurityData();

    blockData.setValidator(validatorPersona);

    let merkleRootValidator = BeanDataBlock.calculateMerkleRootValidator(blockData);

    blockData.setMerkleRootValidator(merkleRootValidator);

    return blockData;
}
