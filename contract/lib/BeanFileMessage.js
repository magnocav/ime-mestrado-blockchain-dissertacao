#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const BeanState = require('./BeanState.js');

/**
 * Enumerate of possibilities for transport values.
 */
const transport = {
    ENCRYPTED: 'ENCRYPTED',
    SIGNED: 'SIGNED',
    CLEAR: 'CLEAR',
    UNDEFINED: 'UNDEFINED'
};

const logPrefix = '\n {BeanFileMessage} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text){
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * Encapsulates the logic about the data related to the file that configures the message stored in the blockchain.
 */
class BeanFileMessage extends BeanState{

    static getTransport(){
        return transport;
    }

    /**
     * Load default values for this class
     */
    constructor(){
        super();
        this.setFileName(undefined);
        this.setFileType(undefined);
        this.setFileExtName(undefined);
        this.setFileSize(undefined);
        this.setHashSigned(undefined);
        this.setMessage(undefined);
        this.setTransportType(transport.UNDEFINED);
    };

    static newBeanFileMessage(){
        return new BeanFileMessage();
    }

    /**
     * Creates a new prototype of BeanFileMessage receiving parameters.
     * @param {BeanFileMessage} fileMessage A kind of BeanFileMessage configured with values.
     */
    static createBeanFileMessage(fileMessage){
        
        let newInstance = new BeanFileMessage();

        newInstance.setFileName(fileMessage.fileName);
        newInstance.setFileType(fileMessage.fileType);
        newInstance.setFileExtName(fileMessage.fileExtName);
        newInstance.setFileSize(fileMessage.fileSize);

        newInstance.setHashSigned(fileMessage.hashSigned);
        newInstance.setMessage(fileMessage.message);
        newInstance.setTransportType(fileMessage.transportType);
        
        return newInstance;
    }

    setFileName(fileName){
        this.fileName = fileName;
    }

    setFileType(fileType){
        this.fileType = fileType;
    }

    setFileExtName(fileExtName){
        this.fileExtName = fileExtName;
    }

    setFileSize(fileSize){
        this.fileSize = fileSize;
    }

    setHashSigned(hashSigned){
        this.hashSigned = hashSigned;
    }

    setMessage(message){
        this.message = message;
    }

    setTransportType(transportType){
        this.transportType = transportType;
    }

    /**
    * Checks the equality between the parameter and this instance object.
    * @param {BeanFileMessage} fileMessage Object to be verified about equality.
    */
    equals(fileMessage){

        if (fileMessage == null || fileMessage == undefined){
            return false;
        } else if (this.message != fileMessage.message){
            return false;
        } else if (this.hashSigned != fileMessage.hashSigned){
            return false;
        } else if (this.fileSize != fileMessage.fileSize){
            return false;
        } else if (this.fileExtName != fileMessage.fileExtName) {
            return false;
        } else if (this.fileType != fileMessage.fileType) {
            return false;
        } else if (this.fileName != fileMessage.fileName){
            return false;
        } else if (this.transportType != fileMessage.transportType){
                return false;
        } 
        
        logWrite(`[equals] BeanFileMessage equals TRUE`);
        return true;
    }
    
}

module.exports = BeanFileMessage;

// END