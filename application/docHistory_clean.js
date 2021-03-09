#!/usr/bin/env node
'use strict';

const fs = require('fs');

const BeanUser = require('../contract/lib/BeanUser.js');
const BeanDataBlock = require('../contract/lib/BeanDataBlock.js');
const BeanTransaction = require('../contract/lib/BeanTransaction.js');
const ResponseModel = require('../contract/lib/ResponseModel.js');

const ChaincodeClientTx = require('./gateway/ChaincodeClientTx.js');
const ClientReference = require('./ClientReference.js');
const ClientUtil = require('./ClientUtil.js');

const utf8 = BeanTransaction.getUTF8();

const transactionHistory = BeanTransaction.getTxStatus().HISTORY;
const contractName = BeanTransaction.getContractName();

const DocJsonIssued = ClientReference.getDocJsonIssued();
const DocJsonHistory = ClientReference.getDocJsonHistory();

const dirWallets = '../wallet';

const quantArgs = 2;


main().then(() => {

    console.log('\n Programa de historico completado. \n');

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

    var chaincodeTx = await ChaincodeClientTx.newChaincodeClientTx(dirWallets, organizationName, walletName, transactionHistory, contractName, pathOfGatewayConfig);

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

    var historyJson = JSON.stringify(response.txContent);

    fs.writeFileSync(DocJsonHistory, Buffer.from(historyJson.toString()), utf8);
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
        throw 'Todos os parametros devem ser preenchidos';
    }
}
