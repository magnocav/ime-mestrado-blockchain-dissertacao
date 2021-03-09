#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

// SDK Library to asset with writing the logic
const { Contract, Context } = require('fabric-contract-api');

// Business logic (well just util but still it's general purpose logic)
const util = require('util');
// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
// const openpgp = require('openpgp');

const LedgerDocAsset = require('../ledger/LedgerDocAsset.js');

const BeanState = require('../lib/BeanState.js');
const BeanUser = require('../lib/BeanUser.js');
const BeanFileMessage = require('../lib/BeanFileMessage.js');
const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');
const ResponseModel = require('../lib/ResponseModel.js');
const CryptoWalletPGPUtil = require('../lib/CryptoWalletPGPUtil.js');
const EccUtil = require('../lib/CryptoKeyUtil.js');

const NotarizeOps = require('./NotarizeOps.js');

//----------------------
const CONTRACTNAME = BeanTransaction.getContractName();

const CONTRACTVERSION = BeanTransaction.getContractVersion();

const ContractNotarizeDocument = BeanTransaction.getContractNotarizeDocument();
//----------------------

const hex = BeanTransaction.getHEX();
const utf8 = BeanTransaction.getUTF8();
const base64 = BeanTransaction.getBASE64();
const sha256 = BeanTransaction.getSHA256();

const logPrefix = '\n {NotarizeDocument} ';
const lines = ` \n ===---===---===---===---===---===---===---===---===---===---=== \n `;

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}


/**
 * A custom context provides easy access to list of all documents
 */
class NotarizeContext extends Context {

    /**
     * Load default values for this class.
     * All documents are held in a set of assets.
     */
    constructor() {
        super();
        this.ledgerDocAsset = new LedgerDocAsset(this);
    }
}


/**
 * Define smart contract by extending Fabric Contract class
 *
 */
class NotarizeDocument extends Contract {

    /**
     * Load default values for this class.
     * Set the unique name when multiple contracts per chaincode file
     */
    constructor() {
        super(ContractNotarizeDocument);
    }


    /**
     * Define a custom context
    */
    createContext() {
        return new NotarizeContext();
    }


    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {

        var response = ResponseModel.newResponseModel();

        try {
            let message = `Instantiate the smart contract ${CONTRACTNAME}, object ${ContractNotarizeDocument}, with version ${CONTRACTVERSION}`;
            logWrite(`[instantiate] ${message}`);

            response.setTxMessage(message);
            response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
            response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        // Must return a serialized object to caller of smart contract
        logWrite(`[instantiate] ${response.serialize()}`);
        logWrite(`\n-->[ instantiate ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }

    /**
     * Upgrade to perform any configuration of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async upgrade(ctx) {

        var response = ResponseModel.newResponseModel();

        try {
            let message = `Upgrade the smart contract ${CONTRACTNAME}, object ${ContractNotarizeDocument}, with version ${CONTRACTVERSION}`;
            logWrite(`[upgrade] ${message}`);

            response.setTxMessage(message);
            response.setTxStatus(ResponseModel.getTxStatusType().SUCCESS);
            response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

        } catch (error) {
            console.log(error);
            console.log(error.stack);

            response.setTxMessage(error.toString());
            response.setTxStatus(ResponseModel.getTxStatusType().FAIL);
            response.setTxContent(error.stack);
        }

        // Must return a serialized object to caller of smart contract
        logWrite(`[upgrade] ${response.serialize()}`);
        logWrite(`\n-->[ upgrade ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }

    /**
     * 
     * @param {*} ctx 
     * @param {*} dataReceived 
     */
    async issue(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                let msgError = 'Data content received are NUll or UNDEFINED';
                logWrite(`[issue, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var blockDataJSon = JSON.parse(dataReceived);
            logWrite('[issue] Data Block = ' + JSON.stringify(blockDataJSon));

            var blockDataBeforeIssue = BeanDataBlock.createBeanDataBlock(blockDataJSon);
            logWrite(`[issue] (blockDataBeforeIssue) = ${blockDataBeforeIssue.stringify()}`);

            var status = blockDataBeforeIssue.status;

            if (status != BeanDataBlock.getBlockState().ISSUED) {
                let msgError = 'Document must be in ISSUED state before registry';
                logWrite(`[issue, B] Message: ${msgError}`);
                throw msgError;
                // stop here
            }

            var notops = new NotarizeOps();

            // Validate Issuer Data
            var issuerVerify = await notops.validateIssuerBlock(blockDataBeforeIssue);

            if (issuerVerify == false) {
                let msgError = 'Issuer data is invalid inside block';
                logWrite(`[issue, C] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }
            
            logWrite('[issue] Issuer data is valid inside block with (issuer.publicId) = ' + blockDataBeforeIssue.issuer.publicId);

            blockDataBeforeIssue.configDateTimeLedger();
            logWrite('[issue] (blockDataBeforeIssue) after validation and before -> ctx.ledgerDocAsset.addDocAsset = ' + blockDataBeforeIssue.stringify());

            //----------------------------------------------
            logWrite(`[issue] Add the object with ISSUED State to the ledger world state`);
            var blockDataAfterIssue = await ctx.ledgerDocAsset.addDocAsset(blockDataBeforeIssue);

            if (blockDataAfterIssue == null || blockDataAfterIssue == undefined) {
                let msgError = 'After LEDGER.addDocAsset function the Block Data is NULL or UNDEFINED';
                logWrite(`[issue, D] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            logWrite(`[issue] BlockData ISSUED with key = ${blockDataAfterIssue.key} and status = ${blockDataAfterIssue.status}`);

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

        // Must return a serialized object to caller of smart contract
        logWrite(`[issue] ${response.serialize()}`);
        logWrite(`\n-->[ issue ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }

    /**
     * 
     * @param {*} ctx 
     * @param {*} dataReceived 
     */
    async validate(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                let msgError = 'Data content received are NUll or UNDEFINED';
                logWrite(`[validate, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var blockDataJSon = JSON.parse(dataReceived);

            var blockDataBeforeValidate = BeanDataBlock.createBeanDataBlock(blockDataJSon);
            logWrite('[validate] (blockDataBeforeValidate) before validation = ' + blockDataBeforeValidate.stringify());

            var status = blockDataBeforeValidate.status;

            if (status != BeanDataBlock.getBlockState().VALIDATED) {
                let msgError = 'Document must be in VALIDATED state before to be written to ledger';
                logWrite(`[validate, B] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var notops = new NotarizeOps();

            // Validate Issuer Data
            var issuerVerify = await notops.validateIssuerBlock(blockDataBeforeValidate);

            if (issuerVerify == false) {
                let msgError = 'Issuer data is invalid inside block';
                logWrite(`[validate, C] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            logWrite('[validate] Issuer data is valid inside block, with (issuer.publicId) = ' + blockDataBeforeValidate.issuer.publicId);

            // Validate Validator Data
            var validatorVerify = await notops.validateValidatorBlock(blockDataBeforeValidate);

            if (validatorVerify == false) {
                let msgError = 'Validator data is invalid inside block';
                logWrite(`[validate, D] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }
            
            logWrite('[validate] Validator data is valid inside block with (validator.publicId) = ' + blockDataBeforeValidate.validator.publicId);

            blockDataBeforeValidate.configDateTimeLedger();
            logWrite('[validate] (blockDataBeforeValidate) after validation and before -> ctx.ledgerDocAsset.updateDocAsset = ' + blockDataBeforeValidate.stringify());

            //----------------------------------------------
            logWrite(`[validate] Change the object with VALIDATED State to the ledger world state`);
            var blockDataAfterValidate = await ctx.ledgerDocAsset.updateDocAsset(blockDataBeforeValidate);

            if (blockDataAfterValidate == null || blockDataAfterValidate == undefined) {
                let msgError = 'After LEDGER.updateDocAsset function the Block Data is NULL or UNDEFINED';
                logWrite(`[validate, E] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            logWrite(`[validate] BlockData VALIDATED with key = ${blockDataAfterValidate.key} and status = ${blockDataAfterValidate.status}`);

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

        // Must return a serialized object to caller of smart contract
        logWrite(`[validate] ${response.serialize()}`);
        logWrite(`\n-->[ validate ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }

    /**
     * 
     * @param {*} ctx 
     * @param {*} dataReceived 
     */
    async retrieve(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                let msgError = 'Data content received are NUll or UNDEFINED';
                logWrite(`[retrieve, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            logWrite('[retrieve] Data block from client = ' + JSON.stringify(blockDataJSonFromClient));

            var blockDataBeforeGet = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            logWrite('[retrieve] (blockDataBeforeGet) = ' + blockDataBeforeGet.stringify());
            logWrite('[retrieve] Key in data block object = ' + blockDataBeforeGet.key);

            var reader = blockDataBeforeGet.reader;
            logWrite('[retrieve] Reader: ' + JSON.stringify(reader));

            //----------------------------------------------
            var keyOfDocument = blockDataBeforeGet.getKey();

            logWrite(`[retrieve] Query in the ledger to get object where key = ${keyOfDocument}`);
            var blockDataRetrieved = await ctx.ledgerDocAsset.getDocAsset(keyOfDocument);

            if (blockDataRetrieved == null || blockDataRetrieved == undefined) {
                let msg = `The data block does not exist stored in the Ledger with key: ${keyOfDocument}`;
                logWrite(`[retrieve, B] Message: ${msg}`);

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                let blockDataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataRetrieved);

                blockDataFromLedger.setReader(reader);

                logWrite(`[retrieve] BlockData RETRIEVED with key = ${blockDataFromLedger.key} and status = ${blockDataFromLedger.status}`);

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

        // Must return a serialized object to caller of smart contract
        logWrite(`[retrieve] ${response.serialize()}`);
        logWrite(`\n-->[ retrieve ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }


    /**
     * 
     * @param {*} ctx 
     * @param {*} dataReceived 
     */
    async read(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                let msgError = 'Data content received are NUll or UNDEFINED';
                logWrite(`[read, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            logWrite('[read] Data block from client = ' + JSON.stringify(blockDataJSonFromClient));

            var blockDataBeforeGet = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            logWrite('[read] Data block as object = ' + JSON.stringify(blockDataBeforeGet));
            logWrite('[read] Key in data block object = ' + blockDataBeforeGet.key);

            // Separate READER from the block
            var reader = blockDataBeforeGet.reader;
            logWrite('[read] Reader: ' + JSON.stringify(reader));

            //----------------------------------------------
            var keyOfDocument = blockDataBeforeGet.getKey();

            logWrite(`[read] Query in the ledger to get object where key = ${keyOfDocument}`);

            var notops = new NotarizeOps();

            var blockDataRetrieved = await ctx.ledgerDocAsset.getDocAsset(keyOfDocument);

            if (blockDataRetrieved == null || blockDataRetrieved == undefined) {

                let msg = `The data block does not exist stored in the Ledger with key: ${keyOfDocument}`;
                logWrite(`[read, B] Message: ${msg}`);

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                //let blockDataRetrieved = JSON.parse(blockDataRetrievedJSon);
                let blockDataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataRetrieved);

                logWrite(`[read] BlockData RETRIEVED with key = ${blockDataFromLedger.key} and status = ${blockDataFromLedger.status}`);

                let status = blockDataFromLedger.status;
                if (status == BeanDataBlock.getBlockState().ISSUED) {
                    let msgError = 'Document must be in VALIDATED or REVOKED state before to be read by somebody';
                    logWrite(`[read, B] Message: ${msgError}`);
                    throw msgError;
                    //stop here;
                }    

                // Insert the READER in block to verify if reader is inside Recicpients List after
                blockDataFromLedger.setReader(reader);

                //----------------------------------------------
                // Validate ISSUER and VALIDATOR entries
                var blockDataWithReader = await notops.validateRegistryReader(blockDataFromLedger);

                logWrite(`[read] BlockData Read from Reader with key = ${blockDataWithReader.key} and status = ${blockDataWithReader.status}`);

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

        // Must return a serialized object to caller of smart contract
        logWrite(`[read] ${response.serialize()}`);
        logWrite(`\n-->[ read ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }


    /**
     * 
     * @param {*} ctx 
     * @param {*} dataReceived 
     */
    async revoke(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                let msgError = 'Data content received are NUll or UNDEFINED';
                logWrite(`[revoke, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            logWrite('[revoke] Data block from client = ' + JSON.stringify(blockDataJSonFromClient));

            var blockDataFromCaller = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            logWrite('[revoke] Data block object = ' + JSON.stringify(blockDataFromCaller));
            logWrite('[revoke] Key in data block object = ' + blockDataFromCaller.key);

            var revoker = blockDataFromCaller.revoker;
            logWrite('[revoke] Revoker: ' + JSON.stringify(revoker));

            //----------------------------------------------
            var keyOfDocument = blockDataFromCaller.getKey();

            //----------------------------------------------
            logWrite(`[revoke] Query in the ledger to get object where key = ${keyOfDocument}`);

            var notops = new NotarizeOps();

            var blockDataRetrieved = await ctx.ledgerDocAsset.getDocAsset(keyOfDocument);

            if (blockDataRetrieved == null || blockDataRetrieved == undefined) {

                let msg = `The data block does not exist stored in the Ledger with key: ${keyOfDocument}`;
                logWrite(`[revoke, B] Message: ${msg}`);

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                //var blockDataRetrieved = JSON.parse(blockDataRetrievedJSon);
                var blockDataFromLedger = BeanDataBlock.createBeanDataBlock(blockDataRetrieved);

                logWrite(`[revoke] BlockData RETRIEVED with key = ${blockDataFromLedger.key} and status = ${blockDataFromLedger.status}`);

                // Verify status from ledger
                var statusFromledger = blockDataFromLedger.status;
                if (statusFromledger == BeanDataBlock.getBlockState().REVOKED) {
                    let msgError = `Document is already REVOKED before with Key = ${blockDataFromLedger.key}`;
                    logWrite(`[revoke, C] Message: ${msgError}`);
                    throw msgError;
                }

                var issuerFromLedger = blockDataFromLedger.issuer;
                var validatorFromLedger = blockDataFromLedger.validator;

                if ((revoker.publicId != issuerFromLedger.publicId) && (revoker.publicId != validatorFromLedger.publicId)) {
                    let msgError = `Revoker must be Issuer or Validator in document process before processing`;
                    logWrite(`[revoke, D] Message: ${msgError}`);
                    throw msgError;
                }

                // Verify if the two data blocks are semantic equivalent
                var comparingBlocksFlag = await notops.areEqualBeforeRevoke(blockDataFromCaller, blockDataFromLedger);

                if (!comparingBlocksFlag) {
                    let msgError = `Document submited to revoke has differences in relation to document saved in the ledger`;
                    logWrite(`[revoke, E] Message: ${msgError}`);
                    throw msgError;
                }

                blockDataFromLedger.setRevoker(revoker);
                blockDataFromLedger.setDateTimeRevoke(blockDataFromCaller.dateTimeRevoke);
                blockDataFromLedger.setDateTimeSignedByRevoker(blockDataFromCaller.dateTimeSignedByRevoker);
                // Configura status como REVOKED
                blockDataFromLedger.setStatus(BeanDataBlock.getBlockState().REVOKED);

                blockDataFromLedger.configDateTimeLedger();
                logWrite('[revoke] (blockDataFromLedger) before -> ctx.ledgerDocAsset.updateDocAsset = ' + blockDataFromLedger.stringify());

                //----------------------------------------------
                // Update the object to the list of all similar objects in the ledger world state
                logWrite(`[revoke] Change the object with REVOKED State to the ledger world state`);
                var blockDataResponseObject = await ctx.ledgerDocAsset.updateDocAsset(blockDataFromLedger);

                if (blockDataResponseObject == null || blockDataResponseObject == undefined) {
                    let msgError = 'After LEDGER.updateDocAsset function the Block Data is NULL or UNDEFINED';
                    logWrite(`[revoke, F] Message: ${msgError}`);
                    throw msgError;
                    //stop here;
                }

                var blockDataAfterRevoke = BeanDataBlock.createBeanDataBlock(blockDataResponseObject);

                logWrite(`[revoke] Data block REVOKED with key = ${blockDataAfterRevoke.key} and status = ${blockDataAfterRevoke.status}`);

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

        // Must return a serialized object to caller of smart contract
        logWrite(`[revoke] ${response.serialize()}`);
        logWrite(`\n-->[ revoke ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }


    /**
     * 
     * @param {*} ctx 
     * @param {*} dataReceived 
     */
    async history(ctx, dataReceived) {

        var response = ResponseModel.newResponseModel();

        try {

            if (dataReceived == null || dataReceived == undefined) {
                let msgError = 'Data content received are NUll or UNDEFINED';
                logWrite(`[history, A] Message: ${msgError}`);
                throw msgError;
                //stop here;
            }

            var blockDataJSonFromClient = JSON.parse(dataReceived);
            logWrite('[history] Data block from client = ' + JSON.stringify(blockDataJSonFromClient));

            var blockDataBeforeGet = BeanDataBlock.createBeanDataBlock(blockDataJSonFromClient);
            logWrite('[history] (blockDataBeforeGet) = ' + blockDataBeforeGet.stringify());
            logWrite('[history] Key in data block object = ' + blockDataBeforeGet.key);

            var reader = blockDataBeforeGet.reader;
            logWrite('[history] Reader: ' + JSON.stringify(reader));

            //----------------------------------------------
            var keyOfDocument = blockDataBeforeGet.getKey();

            logWrite(`[history] Query in the ledger to get history of transactions where object key = ${keyOfDocument}`);
            var historyTxArray = await ctx.ledgerDocAsset.getHistoryAsset(keyOfDocument);

            if (historyTxArray == null || historyTxArray == undefined) {
                let msg = `The history of transactions does not exist stored in the Ledger with key: ${keyOfDocument}`;
                logWrite(`[history, B] Message: ${msg}`);

                response.setTxMessage(msg);
                response.setTxStatus(ResponseModel.getTxStatusType().EMPTY);
                response.setTxContent(ResponseModel.getTxStatusType().EMPTY);

            } else {

                let jsonTxContent = {};
                
                jsonTxContent.reader = JSON.stringify(reader);
                jsonTxContent.history = JSON.stringify(historyTxArray);
                
                logWrite(`[history] History of transactions RETRIEVED with key = ${keyOfDocument}`);

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

        // Must return a serialized object to caller of smart contract
        logWrite(`[history] ${response.serialize()}`);
        logWrite(`\n-->[ history ]<-- BEFORE RETURN -- ${lines}`);

        return response.toBuffer();
    }

}

module.exports = NotarizeDocument;
