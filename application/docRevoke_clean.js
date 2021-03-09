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
const transactionRevoke = BeanTransaction.getTxStatus().REVOKE;
const contractName = BeanTransaction.getContractName();

const DocJsonIssued = ClientReference.getDocJsonIssued();
const DocJsonRevoked = ClientReference.getDocJsonRevoked();

const dirWallets = '../wallet';
const quantArgs = 2;


main().then(() => {

    console.log('\n Programa de revogaçao completado. \n');

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

    var revokerPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    var chaincodeTxRetrieve = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionRetrieve, contractName);    

    var blockDataRetrieved = await retrieveDocument(chaincodeTxRetrieve, documentKey, revokerPGP);

    var statusBefore = blockDataRetrieved.status;

    if (statusBefore == BeanDataBlock.getBlockState().ISSUED){
        
        var issuerVerify = await docUtil.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            throw 'Dados do Emissor invalidos dentro do bloco';
        }

    } else if (statusBefore == BeanDataBlock.getBlockState().VALIDATED){
            
        var issuerVerify = await docUtil.validateIssuerBlock(blockDataRetrieved);
        if (issuerVerify == false){
            throw 'Dados do Emissor invalidos dentro do bloco';
        }
        
        var validatorVerify = await docUtil.validateValidatorBlock(blockDataRetrieved);
        if (validatorVerify == false){
            throw 'Dados do Validador invalidos dentro do bloco';
        }

    } else {
        throw 'O documento foi revogado anteriormente por outro processamento';
    }

    var issuerRetrieved = blockDataRetrieved.issuer;
    var validatorRetrieved = blockDataRetrieved.validator;

    if ((revokerPGP.publicId != issuerRetrieved.publicId) && (revokerPGP.publicId != validatorRetrieved.publicId)){
        throw 'O revogador deve ser Emissor ou Validador no processo do documento';
    }

    var chaincodeTxRevoke = await prepareChaincodeClientTx(dirWallets, organizationName, walletName, transactionRevoke, contractName);  

    var blockDataRevoked = await revokeDocument(chaincodeTxRevoke, revokerPGP, blockDataRetrieved);

    var statusAfter = blockDataRevoked.status;

    if (statusAfter != BeanDataBlock.getBlockState().REVOKED){
        throw 'O documento deve estar no status revogado para ser concluido no processo';
    }

    fs.writeFileSync(DocJsonRevoked, blockDataRevoked.serialize(), utf8);

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


async function retrieveDocument(chaincodeTxRetrieve, documentKey, revoker){

    let persona = BeanUser.createBeanUser(revoker);
    persona.clearSecurityData();

    var dataToSubmit = BeanDataBlock.newBeanDataBlock();

    dataToSubmit.setReader(persona);
    dataToSubmit.setKey(documentKey);
    
    var txResponse = await chaincodeTxRetrieve.processBlockchainTransaction(dataToSubmit);

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
    var blockDataAfterRetrieve = BeanDataBlock.createBeanDataBlock(blockDataJSon);
    var status = blockDataAfterRetrieve.status;

    return blockDataAfterRetrieve;
}


async function revokeDocument(chaincodeTxRevoke, revoker, blockData){
    
    var blockDataRevoker = await processToAddRevoker(revoker, blockData);

    blockDataRevoker.configDateTimeLedger();

    var txResponse = await chaincodeTxRevoke.processBlockchainTransaction(blockDataRevoker);
    
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
    var blockDataAfterRevoke = BeanDataBlock.createBeanDataBlock(blockDataJSon);
    var status = blockDataAfterRevoke.status;

    return blockDataAfterRevoke;
}


async function processToAddRevoker(revoker, blockData) {

    revoker = await BeanUser.generateSignatureOfUserInfos(revoker);
    
    var dateTimeRevoke = new Date();
    blockData.setDateTimeRevoke(dateTimeRevoke.toISOString());

	let dateTimeHashFactory = createHash();
    let dateTimeRevokeHash = dateTimeHashFactory.update(blockData.dateTimeRevoke).digest(hex);

    var dateTimeSignedByRevoker = await EccUtil.signMessage(revoker, dateTimeRevokeHash);

    blockData.setDateTimeSignedByRevoker(dateTimeSignedByRevoker);
    blockData.setStatus(BeanDataBlock.getBlockState().REVOKED);

	var revokerPersona = BeanUser.createBeanUser(revoker);
    
    revokerPersona.clearSecurityData();

	blockData.setRevoker(revokerPersona);
      
    return blockData;        
}
