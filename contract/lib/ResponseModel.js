#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const crypto = require('crypto');

const BeanState = require('./BeanState.js');
const BeanTransaction = require('./BeanTransaction.js');

const hex = BeanTransaction.getHEX();
const sha256 = BeanTransaction.getSHA256();

const logPrefix = '\n {ResponseModel} ';

/**
 * Enumerate of possibilities for types of transaction status.
 */
const txStatusType = {
    SUCCESS: 'SUCCESS',
    EMPTY: 'EMPTY',
    FAIL: 'FAIL'
}

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * Class that encapsulates data and functions about ResponseModel,
 * with logics to pre-define the response that smart contract will send back to client.
 */
class ResponseModel extends BeanState{
    
    static getTxStatusType(){
        return txStatusType;
    }
    
    /**
     * Load default values for this class
     */
    constructor(){
        super();
        this.setTxMessage(undefined);
        this.setTxStatus(undefined);
        this.setTxContent(undefined);
    }

    static newResponseModel(){
        return new ResponseModel();
    }

    /**
     * Creates a new prototype of ResponseModel receiving parameters.
     * @param {ResponseModel} response A kind of ResponseModel configured with values.
     */
    static createResponseModel(response){

        let newInstance = new ResponseModel();
        
        newInstance.setTxMessage(response.txMessage);
        newInstance.setTxStatus(response.txStatus);
        newInstance.setTxContent(response.txContent);
        
        return newInstance;
    }


    /**
     * Used to translate the response from Fabric Ledger that was encapsulated before.
     * The response from Fabric Ledger as JSON model looks like 
     *   {"type":"Buffer","data":[byte array]}
     * @param {JSON} txResponseObject The response from Fabric Ledger as JSON
     */
    static translateLedgerResponse(txResponseObject){
        
        // logWrite(`[translateLedgerResponse] ${txResponseObject}`);
        let objTxRetrieve = JSON.parse(txResponseObject);
    
        let byteArray = objTxRetrieve.data;
        // logWrite(`[translateLedgerResponse] ${byteArray}`);
    
        let bufferWithJson = Buffer.from(byteArray);

        let asString = bufferWithJson.toString();
    
        logWrite(`[translateLedgerResponse] ${asString}`);

        let prototypeResponse = JSON.parse(asString);
    
        var responseObject = ResponseModel.createResponseModel(prototypeResponse);

        return responseObject;
    }

    /**
     * Load data from buffer
     * @param {buffer} buffer Data ancapsulated in a buffer type.
     */
    static fromBuffer(buffer) {
        
        logWrite(`[fromBuffer] buffer = ${buffer}`);

        return ResponseModel.deserialize(buffer);
    }

    /**
     * Deserialize a state data to Response Model
     * @param {buffer} data to form back into the object
     */
    static deserialize(dataToDeserialize) {
        
        logWrite(`[deserialize] data = ${dataToDeserialize}`);
        
        let deserializeResult = BeanState.deserializeClass(dataToDeserialize, ResponseModel);

        let responseModel = ResponseModel.createResponseModel(deserializeResult);

        return responseModel;
    }

    setTxMessage(message){
        this.txMessage = message;
    }

    setTxStatus(status){
        this.txStatus = status;
    }

    setTxContent(content){
        this.txContent = content;
    }
}

module.exports = ResponseModel;