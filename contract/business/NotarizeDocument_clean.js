#!/usr/bin/env node
'use strict';

const { Contract, Context } = require('fabric-contract-api');

const LedgerDocAsset = require('../ledger/LedgerDocAsset.js');
const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');
const ResponseModel = require('../lib/ResponseModel.js');
const NotarizeOps = require('./NotarizeOps.js');

const ContractNotarizeDocument = BeanTransaction.getContractNotarizeDocument();

class NotarizeContext extends Context {

    constructor() {
        super();
        this.ledgerDocAsset = new LedgerDocAsset(this);
    }
}


class NotarizeDocument extends Contract {

    constructor() {
        super(ContractNotarizeDocument);
    }

    createContext() {
        return new NotarizeContext();
    }


    async instantiate(ctx) {

        var response = ResponseModel.newResponseModel();

        try {

            response.setTxMessage('Instanciacao do contrato inteligente');
            response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
            response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async upgrade(ctx) {

        var response = ResponseModel.newResponseModel();

        try {

            response.setTxMessage('Upgrade do contrato inteligente');
            response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
            response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async issue(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                throw 'O conteudo dos dados recebidos e Nulo ou Indefinido';
            }

            var blockDataJSon = JSON.parse(dataReceived);
            var blockDataBeforeIssue = BeanDataBlock.createBeanDataBlock(blockDataJSon);
            var status = blockDataBeforeIssue.status;

            if (status != BeanDataBlock.getBlockState().ISSUED) {
                throw 'O documento deve estar no estado EMITIDO antes do registro';
            }

            var notops = new NotarizeOps();
            var issuerVerify = await notops.validateIssuerBlock(blockDataBeforeIssue);

            if (issuerVerify == false) {
                throw 'Dados do Emissor invalidos dentro do bloco';
            }
            
            blockDataBeforeIssue.configDateTimeLedger();
            var blockDataAfterIssue = await ctx.ledgerDocAsset.addDocAsset(blockDataBeforeIssue);

            if (blockDataAfterIssue == null || blockDataAfterIssue == undefined) {
                throw 'Bloco de dados esta Nulo ou Indefinido';
            }

            response.setTxMessage(blockDataAfterIssue.status);
            response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
            response.setTxContent(blockDataAfterIssue.stringify());

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async validate(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                throw 'O conteudo dos dados recebidos e Nulo ou Indefinido';
            }

            var blockDataJSon = JSON.parse(dataReceived);
            var blockDataBeforeValidate = BeanDataBlock.createBeanDataBlock(blockDataJSon);

            var status = blockDataBeforeValidate.status;

            if (status != BeanDataBlock.getBlockState().VALIDATED) {
                throw 'O documento deve estar no estado VALIDADO antes de ser gravado no Ledger';
            }

            var notops = new NotarizeOps();

            var issuerVerify = await notops.validateIssuerBlock(blockDataBeforeValidate);

            if (issuerVerify == false) {
                throw 'Dados do Emissor invalidos dentro do bloco';
            }

            var validatorVerify = await notops.validateValidatorBlock(blockDataBeforeValidate);

            if (validatorVerify == false) {
                throw 'Dados do Validador invalidos dentro do bloco';
            }
            
            blockDataBeforeValidate.configDateTimeLedger();
            var blockDataAfterValidate = await ctx.ledgerDocAsset.updateDocAsset(blockDataBeforeValidate);

            if (blockDataAfterValidate == null || blockDataAfterValidate == undefined) {
                throw 'Bloco de dados esta Nulo ou Indefinido';
            }

            response.setTxMessage(blockDataAfterValidate.status);
            response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
            response.setTxContent(blockDataAfterValidate.stringify());

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async retrieve(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                throw 'O conteudo dos dados recebidos e Nulo ou Indefinido';
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            var blockDataBeforeGet = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            var reader = blockDataBeforeGet.reader;
            var keyOfDocument = blockDataBeforeGet.getKey();
            var blockDataRetrieved = await ctx.ledgerDocAsset.getDocAsset(keyOfDocument);

            if (blockDataRetrieved == null || blockDataRetrieved == undefined) {
                let msg = 'O bloco de dados nao existe armazenado no ledger com a chave: ' + keyOfDocument;

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                let blockDataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataRetrieved);
                blockDataFromLedger.setReader(reader);

                response.setTxMessage(blockDataFromLedger.status);
                response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
                response.setTxContent(blockDataFromLedger.stringify());
            }

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async read(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                throw 'O conteudo dos dados recebidos e Nulo ou Indefinido';
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            var blockDataBeforeGet = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            var reader = blockDataBeforeGet.reader;
            var keyOfDocument = blockDataBeforeGet.getKey();
            var blockDataRetrieved = await ctx.ledgerDocAsset.getDocAsset(keyOfDocument);
            var notops = new NotarizeOps();

            if (blockDataRetrieved == null || blockDataRetrieved == undefined) {

                let msg = 'O bloco de dados nao existe armazenado no ledger com a chave: ' + keyOfDocument;

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                let blockDataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataRetrieved);

                let status = blockDataFromLedger.status;
                if (status == BeanDataBlock.getBlockState().ISSUED) {
                    throw 'O documento deve estar no estado VALIDADO ou REVOGADO antes de ser lido por alguem';
                }    

                blockDataFromLedger.setReader(reader);
                var blockDataWithReader = await notops.validateRegistryReader(blockDataFromLedger);

                response.setTxMessage(blockDataWithReader.status);
                response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
                response.setTxContent(blockDataWithReader.stringify());
            }

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async revoke(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                throw 'O conteudo dos dados recebidos e Nulo ou Indefinido';
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            var blockDataFromCaller = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            var revoker = blockDataFromCaller.revoker;
            var keyOfDocument = blockDataFromCaller.getKey();
            var blockDataRetrieved = await ctx.ledgerDocAsset.getDocAsset(keyOfDocument);
            var notops = new NotarizeOps();

            if (blockDataRetrieved == null || blockDataRetrieved == undefined) {

                let msg = 'O bloco de dados nao existe armazenado no ledger com a chave:' + keyOfDocument;
                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);
            } else {

                var blockDataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataRetrieved);

                var statusFromledger = blockDataFromLedger.status;
                if (statusFromledger == BeanDataBlock.getBlockState().REVOKED) {
                    let msgError = 'O documento ja foi REVOGADO antes com a chave: ' + blockDataFromLedger.key;
                    throw msgError;
                }

                var issuerFromLedger = blockDataFromLedger.issuer;
                var validatorFromLedger = blockDataFromLedger.validator;

                if ((revoker.publicId != issuerFromLedger.publicId) && (revoker.publicId != validatorFromLedger.publicId)) {
                    throw 'O revogador deve ser emissor ou validador no processo do documento';
                }

                var comparingBlocksFlag = await notops.areEqualBeforeRevoke(blockDataFromCaller, blockDataFromLedger);

                if (!comparingBlocksFlag) {
                    throw 'O documento enviado para revogar possui diferencas em relacao ao documento salvo no ledger.';
                }

                blockDataFromLedger.setRevoker(revoker);
                blockDataFromLedger.setDateTimeRevoke(blockDataFromCaller.dateTimeRevoke);
                blockDataFromLedger.setDateTimeSignedByRevoker(blockDataFromCaller.dateTimeSignedByRevoker);
                blockDataFromLedger.setStatus(BeanDataBlock.getBlockState().REVOKED);

                blockDataFromLedger.configDateTimeLedger();

                var blockDataResponseObject = await ctx.ledgerDocAsset.updateDocAsset(blockDataFromLedger);

                if (blockDataResponseObject == null || blockDataResponseObject == undefined) {
                    throw 'Bloco de dados esta Nulo ou Indefinido';
                }

                var blockDataAfterRevoke = BeanDataBlock.createBeanDataBlock(blockDataResponseObject);

                response.setTxMessage(blockDataAfterRevoke.status);
                response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
                response.setTxContent(blockDataAfterRevoke.stringify());
            }

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }


    async history(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                throw 'O conteudo dos dados recebidos e Nulo ou Indefinido';
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            var blockDataBeforeGet = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            var reader = blockDataBeforeGet.reader;
            var keyOfDocument = blockDataBeforeGet.getKey();
            var historyTxArray = await ctx.ledgerDocAsset.getHistoryAsset(keyOfDocument);

            if (historyTxArray == null || historyTxArray == undefined) {
                let msg = 'O historico de transacoes nao existe armazenado no ledger com a chave' + keyOfDocument;

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                let jsonTxContent = {};
                
                jsonTxContent.reader = JSON.stringify(reader);
                jsonTxContent.history = JSON.stringify(historyTxArray);
                
                response.setTxMessage(BeanDataBlock.getBlockState().HISTORY);
                response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
                response.setTxContent(jsonTxContent);
            }

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        return response.toBuffer();
    }

}

module.exports = NotarizeDocument;
