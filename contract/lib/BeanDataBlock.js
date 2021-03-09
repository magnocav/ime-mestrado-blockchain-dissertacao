#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const crypto = require('crypto');

const BeanState = require('./BeanState.js');
const BeanUser = require('./BeanUser.js');
const BeanFileMessage = require('./BeanFileMessage.js');
const BeanTransaction = require('./BeanTransaction.js');

const hex = BeanTransaction.getHEX();
const sha256 = BeanTransaction.getSHA256();

/**
 * Enumerate of possibilities for state values.
 */
const blockState = {
    ISSUED: 'ISSUED',
    VALIDATED: 'VALIDATED',
    REVOKED: 'REVOKED',
    UNDEFINED: 'UNDEFINED',
    HISTORY: 'HISTORY'
};

const logPrefix = '\n {BeanDataBlock} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text){
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * This class encapsulates the treatment of the data set that will be serialized in the backend system.
 */
class BeanDataBlock extends BeanState{

    static getBlockState(){
        return blockState;
    }

    /**
     * Load default values for this class
     */
    constructor(){
        super();

        this.setDateTimeIssue(undefined);
        this.setDateTimeValidate(undefined);
        this.setDateTimeRevoke(undefined);

        this.setDateTimeSignedByIssuer(undefined);
        this.setDateTimeSignedByValidator(undefined);
        this.setDateTimeSignedByRevoker(undefined);

        this.setIssuer(undefined);
        this.setValidator(undefined);
        this.setRevoker(undefined);
        this.setReader(undefined);

        this.setRecipients(undefined);
        this.setRecipientsHash(undefined);
        this.setRecipientsHashSignedByIssuer(undefined);
        this.setRecipientsHashSignedByValidator(undefined);

        this.setFileMessage(undefined);;

        this.setMerkleRootIssuer(undefined);;
        this.setMerkleRootValidator(undefined);

        this.setStatus(undefined);
        this.setDateTimeLedger(undefined);

        this.setKey(undefined);
    };

    static newBeanDataBlock(){
        return new BeanDataBlock();
    }

    /**
     * Creates a new prototype of BeanDataBlock receiving parameters.
     * @param {BeanDataBlock} dataBlock A kind of BeanDataBlock configured with values.
     */
    static createBeanDataBlock(dataBlock){
        
        let newInstance = new BeanDataBlock();

        newInstance.setDateTimeIssue(dataBlock.dateTimeIssue);
        newInstance.setDateTimeValidate(dataBlock.dateTimeValidate);
        newInstance.setDateTimeRevoke(dataBlock.dateTimeRevoke);

        newInstance.setDateTimeSignedByIssuer(dataBlock.dateTimeSignedByIssuer);
        newInstance.setDateTimeSignedByValidator(dataBlock.dateTimeSignedByValidator);
        newInstance.setDateTimeSignedByRevoker(dataBlock.dateTimeSignedByRevoker);

        newInstance.setIssuer(dataBlock.issuer);
        newInstance.setValidator(dataBlock.validator);
        newInstance.setRevoker(dataBlock.revoker);
        newInstance.setReader(dataBlock.reader);

        newInstance.setRecipients(dataBlock.recipients);
        newInstance.setRecipientsHash(dataBlock.recipientsHash);
        newInstance.setRecipientsHashSignedByIssuer(dataBlock.recipientsHashSignedByIssuer);
        newInstance.setRecipientsHashSignedByValidator(dataBlock.recipientsHashSignedByValidator);

        newInstance.setFileMessage(dataBlock.fileMessage);;

        newInstance.setMerkleRootIssuer(dataBlock.merkleRootIssuer);;
        newInstance.setMerkleRootValidator(dataBlock.merkleRootValidator);

        newInstance.setStatus(dataBlock.status);
        newInstance.setDateTimeLedger(dataBlock.dateTimeLedger);

        newInstance.setKey(dataBlock.key);

        return newInstance;
    }

    /**
     * Concatenate the data related to Issuer and perform the hash calculation for this merkle tree.
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    static calculateMerkleRootIssuer(blockData){

        // Concatenation of data to generate the hash
        let strMerkleRootIssuer =   blockData.dateTimeIssue + 
                                    blockData.dateTimeSignedByIssuer + 
                                    blockData.issuer.publicId + 
                                    blockData.recipientsHash + 
                                    blockData.recipientsHashSignedByIssuer + 
                                    blockData.fileMessage.hashSigned; 

        logWrite('[calculateMerkleRootIssuer] Concatenated string seed of MerkleRootIssuer: ' + strMerkleRootIssuer);

        // Hash of the merkle tree in this dataset
        let hashIssuerFactory = crypto.createHash(sha256);
        let buffer = Buffer.from(strMerkleRootIssuer);
        let hashRootIssuer = hashIssuerFactory.update(buffer.toString()).digest(hex);
   
        return hashRootIssuer;
    }

    /**
     * Concatenate the data related to Validator and perform the hash calculation for this merkle tree.
     * @param {BeanDataBlock} blockData Data block with the set of process information.
     */
    static calculateMerkleRootValidator(blockData){

        // Concatenation of data to generate the hash
        let strMerkleRootValidator = blockData.merkleRootIssuer + 
                                    blockData.dateTimeValidate +  
                                    blockData.dateTimeSignedByValidator + 
                                    blockData.validator.publicId + 
                                    blockData.recipientsHash + 
                                    blockData.recipientsHashSignedByValidator; 

        logWrite('[calculateMerkleRootValidator] Concatenated string seed of MerkleRootValidator: ' + strMerkleRootValidator);

        // Hash of the merkle tree in this dataset
        let hashValidatorFactory = crypto.createHash(sha256);
        let buffer = Buffer.from(strMerkleRootValidator);
        let hashRootValidator = hashValidatorFactory.update(buffer.toString()).digest(hex);
    
        return hashRootValidator;
    }

    setDateTimeIssue (dateTimeIssue){
        this.dateTimeIssue = dateTimeIssue;
    }

    setDateTimeValidate(dateTimeValidate){
        this.dateTimeValidate = dateTimeValidate;
    }

    setDateTimeRevoke(dateTimeRevoke){
        this.dateTimeRevoke = dateTimeRevoke;
    }

    setDateTimeSignedByIssuer(dateTimeSignedByIssuer){
        this.dateTimeSignedByIssuer = dateTimeSignedByIssuer;
    }

    setDateTimeSignedByValidator(dateTimeSignedByValidator){
        this.dateTimeSignedByValidator = dateTimeSignedByValidator;
    }
    
    setDateTimeSignedByRevoker(dateTimeSignedByRevoker){
        this.dateTimeSignedByRevoker = dateTimeSignedByRevoker;
    }

    setIssuer(issuer){
        if (issuer == undefined){
            this.issuer = BeanUser.newBeanUser();
        } else{
            this.issuer = issuer;
        }
    }
    
    setValidator(validator){
        if (validator == undefined){
            this.validator = BeanUser.newBeanUser();
        } else{
            this.validator = validator;
        }
    }

    setRevoker(revoker){
        if (revoker == undefined){
            this.revoker = BeanUser.newBeanUser();
        } else{
            this.revoker = revoker;
        }
    }

    setReader(reader){
        if (reader == undefined){
            this.reader = BeanUser.newBeanUser();
        } else{
            this.reader = reader;
        }
    }

    setRecipients(recipients){
        this.recipients = recipients;
    }

    setRecipientsHash(recipientsHash){
        this.recipientsHash = recipientsHash;
    }

    setRecipientsHashSignedByIssuer(recipientsHashSignedByIssuer){
        this.recipientsHashSignedByIssuer = recipientsHashSignedByIssuer;
    }

    setRecipientsHashSignedByValidator(recipientsHashSignedByValidator){
        this.recipientsHashSignedByValidator = recipientsHashSignedByValidator;
    }

    setFileMessage(fileMessage){
        if (fileMessage == undefined){
            this.fileMessage = BeanFileMessage.newBeanFileMessage();
        } else{
            this.fileMessage = fileMessage;
        }
    }

    setMerkleRootIssuer(merkleRootIssuer){
        this.merkleRootIssuer = merkleRootIssuer;

        if (merkleRootIssuer != null && merkleRootIssuer!= undefined){
            if (this.key == undefined || this.key == null){
                
                let keyParts = this.getCompositeKey();
                this.key = BeanState.makeKey(keyParts);
                logWrite('[setMerkleRootIssuer] key : ' + this.key);
            }
        }
    }
    setMerkleRootValidator(merkleRootValidator){
        this.merkleRootValidator = merkleRootValidator;
    }

    setStatus(status){
        if (status == undefined){
            this.status = blockState.UNDEFINED;
        } else{
            this.status = status;
        }
    }

    setDateTimeLedger(dateTime){
        this.dateTimeLedger = dateTime;
    }

    configDateTimeLedger(){
        let dateTime = new Date();
        this.setDateTimeLedger(dateTime.toISOString());
    }

    getCompositeKey(){
        let arrayValue = [this.merkleRootIssuer, this.dateTimeIssue, this.issuer.userId.email];
        return arrayValue;
    }

    /**
     * Used to translate the data received in Fabric Ledger process that was encapsulated before.
     * The received data in Fabric Ledger as JSON model looks like 
     *   {"type":"Buffer","data":[byte array]}
     * @param {The received data in Fabric Ledger as JSON} txObject 
     */
    static translateLedgerReceived(txObject){
        
        // logWrite(`[translateLedgerReceived] ${txObject}`);
        let objTxRetrieve = JSON.parse(txObject);
    
        let byteArray = objTxRetrieve.data;
        // logWrite(`[translateLedgerReceived] ${byteArray}`);
    
        let bufferWithJson = Buffer.from(byteArray);
    
        // logWrite(`[translateLedgerReceived] ${bufferWithJson.toString()}`);

        let prototypeReceived = JSON.parse(bufferWithJson.toString());
    
        var receivedObject = BeanDataBlock.createBeanDataBlock(prototypeReceived);

        return receivedObject;
    }

    /**
     * Checks the equality between the parameter and this instance object.
     * @param {BeanDataBlock} bean Object to be verified about equality.
     */
    equals(bean) {

        try {
            if (bean == null || bean == undefined){
                return false;
            }
    
            let evalIssuer = true;
            let evalValidator = true;
    
            if (this.status == blockState.ISSUED){
                evalIssuer = this.equalsIssued(bean);
            } else {
                evalIssuer = this.equalsIssued(bean);
                evalValidator = this.equalsValidated(bean);
            }
    
            if (evalIssuer && evalValidator){
                return true;
            } else {
                return false;
            }

        } catch (error) {
            logWrite(`[equals] ${error}`);
            logWrite(`[equals] ${error.stack}`);

            return false;
        }       

    }

    /**
     * About Issuer dataset, checks the equality between the parameter and this instance object.
     * @param {BeanDataBlock} bean Object to be verified about equality.
     */
    equalsIssued(bean){

        if (bean == null || bean == undefined){
            return false;
        } else if (this.key != bean.key){
            return false;
        } else if (this.dateTimeIssue != bean.dateTimeIssue){
            return false;
        } else if (this.dateTimeSignedByIssuer != bean.dateTimeSignedByIssuer){
            return false;
        } else if (this.recipientsHash != bean.recipientsHash){
            return false;
        } else if (this.recipientsHashSignedByIssuer != bean.recipientsHashSignedByIssuer){
            return false;
        } else if (this.merkleRootIssuer != bean.merkleRootIssuer){
            return false;
        } 
        
        let instanceUser = BeanUser.createBeanUser(this.issuer);
        let beanUser = BeanUser.createBeanUser(bean.issuer);

        if (!instanceUser.equals(beanUser)) {
            return false;
        }
        
        let instanceFileMessage = BeanFileMessage.createBeanFileMessage(this.fileMessage);
        let beanFileMessage = BeanFileMessage.createBeanFileMessage(bean.fileMessage);

        if (!instanceFileMessage.equals(beanFileMessage)) {
            return false;
        }
        
        logWrite(`[equalsIssued] BeanDataBlock Issuer : equals TRUE`);
        
        return true;
    }


    /**
     * About Validator dataset, checks the equality between the parameter and this instance object.
     * @param {BeanDataBlock} bean Object to be verified about equality.
     */
    equalsValidated(bean){
        if (bean == null || bean == undefined){
            return false;
        } else if (this.dateTimeValidate != bean.dateTimeValidate){
            return false;
        } else if (this.dateTimeSignedByValidator != bean.dateTimeSignedByValidator){
            return false;
        } else if (this.recipientsHashSignedByValidator != bean.recipientsHashSignedByValidator){
            return false;
        } else if (this.merkleRootValidator != bean.merkleRootValidator){
            return false;
        } 
        
        let instanceUser = BeanUser.createBeanUser(this.validator);
        let beanUser = BeanUser.createBeanUser(bean.validator);

        if (!instanceUser.equals(beanUser)) {
            return false;
        }
        
        logWrite(`[equalsValidated] BeanDataBlock Validator : equals TRUE`);
        return true;
    }

}

module.exports = BeanDataBlock;

// END