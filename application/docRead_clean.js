#!/usr/bin/env node
'use strict';

const BeanUser = require('../contract/lib/BeanUser.js');
const BeanDataBlock = require('../contract/lib/BeanDataBlock.js');
const BeanTransaction = require('../contract/lib/BeanTransaction.js');
const ResponseModel = require('../contract/lib/ResponseModel.js');

const ChaincodeClientTx = require('./gateway/ChaincodeClientTx.js');
const ClientReference = require('./ClientReference.js');
const ClientUtil = require('./ClientUtil.js');

const transactionRead = BeanTransaction.getTxStatus().READ;
const contractName = BeanTransaction.getContractName();

const DocJsonIssued = ClientReference.getDocJsonIssued();

const dirWallets = '../wallet';
const quantArgs = 2;


main().then(() => {

    console.log('\n Programa de leitura completado. \n');

}).catch((e) => {
    console.log('\n Exception ocorrida. \n');
    console.log(e);
    process.exit(-1);
});


async function main() {

    var fileFromReference = DocJsonIssued;

    var appArgs = process.argv.slice(2);

    if (appArgs == undefined || appArgs.length < quantArgs) {
        throw (quantArgs + ' argumentos sao obrigatorios');
    }

    var organizationName = appArgs[0];
    var walletName = appArgs[1];

    await assertParams(organizationName, walletName);
    
    let pathOfGatewayConfig = ClientReference.chooseGatewayFromOrg(organizationName);

    var chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWallets, organizationName, walletName, transactionRead, contractName, pathOfGatewayConfig);

    var docUtil = ClientUtil.newClientUtil();

    var readerPGP = await docUtil.getUserWalletPGP(dirWallets, organizationName, walletName);

    var documentKey = await docUtil.getDocumentKey(fileFromReference);

    let persona = BeanUser.createBeanUser(readerPGP);
    
    persona.clearSecurityData();

    var dataToSubmit = BeanDataBlock.newBeanDataBlock();

    dataToSubmit.setReader(persona);
    dataToSubmit.setKey(documentKey);
    
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

    var blockDataJSonObject = JSON.parse(response.txContent);
    var blockDataRetrieved = BeanDataBlock.createBeanDataBlock(blockDataJSonObject);
    var status = blockDataRetrieved.status;

    var issuerVerify = await docUtil.validateIssuerBlock(blockDataRetrieved);
    if (issuerVerify == false){
        throw 'Dados do Emissor invalidos dentro do bloco';
    }

    if (status != BeanDataBlock.getBlockState().ISSUED){
        
        var validatorVerify = await docUtil.validateValidatorBlock(blockDataRetrieved);
        if (validatorVerify == false){
            throw 'Dados do Validador invalidos dentro do bloco';
        }
    } 

    readerPGP.setPassword(blockDataRetrieved.reader.password);
    readerPGP.setInitVector(blockDataRetrieved.reader.initVector);

    blockDataRetrieved.setReader(readerPGP);

    let decryptOK = await docUtil.processDecryptSave(blockDataRetrieved);

    return decryptOK;
}


async function assertParams(organizationName, walletName) {

    let erroFlag = false;

    if (organizationName == undefined || organizationName == null) {
        erroFlag = true;
    }

    if (walletName == undefined || walletName == null) {
        erroFlag = true;
    }

    if (erroFlag) {
        throw 'Todos os parametros devem ser preenchidos';;
    }
}
