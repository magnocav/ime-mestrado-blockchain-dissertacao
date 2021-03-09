#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const path = require('path');

const BeanState = require('./BeanState.js');

const CONTRACTNAME = 'notarizecontract';

const ContractNotarizeDocument = "ContractNotarizeDocument";

const CONTRACTVERSION = '1.0.0';

const HEX = 'hex';
const UTF8 = 'utf8';
const BASE64 = 'base64';
const SHA256 = 'sha256';
const ALGORITSYMM = 'aes-256-cbc';

// const CHAINCODE_PEER_WALLET_FOLDER = 'CHAINCODE_PEER_WALLET_FOLDER';

const dirWalletsRelative = '../../wallet';

const walletNameValidator = 'validator';

/**
 * Enumerate of possibilities for transaction smart contracts values.
 */
const txStatus = {
    ISSUE: 'issue',
    VALIDATE: 'validate',
    RETRIEVE: 'retrieve',
    READ: 'read',    
    REVOKE: 'revoke',
    HISTORY: 'history'
};

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text){
    if (logActive) { console.log(logPrefix + text); }
}

const logPrefix = '\n {BeanTransaction} ';

/**
 * Class of parameter configuration to facilitate the control of the smart-contract.
 */
class BeanTransaction extends BeanState{

    /**
     * Load default values for this class
     */
    constructor(){
        super();
    }

    static newBeanTransaction(){
        return new BeanTransaction();
    }

    static getTxStatus(){
        return txStatus;
    }

    static getContractName(){
        return CONTRACTNAME;
    }

    static getContractNotarizeDocument(){
        return ContractNotarizeDocument;
    }

    static getContractVersion(){
        return CONTRACTVERSION;
    }

    static getChaincodePeerWalletEnvVar(){
        return chaincodePeerWalletEnvVar;
    }

    static getWalletNameValidator(){
        return walletNameValidator;
    }

    /**
     * Function to retrieve the Wallet PGP within the server that runs the ledger.
     */
    static getFileSystemChaincodePeerWalletFolder(){

        let { CHAINCODE_PEER_WALLET_FOLDER } = process.env;

        logWrite(`[getFileSystemChaincodePeerWalletFolder] CHAINCODE_PEER_WALLET_FOLDER : ${CHAINCODE_PEER_WALLET_FOLDER}`);

        if (CHAINCODE_PEER_WALLET_FOLDER == undefined || CHAINCODE_PEER_WALLET_FOLDER == null){
            CHAINCODE_PEER_WALLET_FOLDER = dirWalletsRelative;
        }

        let place = path.resolve('' + CHAINCODE_PEER_WALLET_FOLDER);

        if (place == undefined || place == null){
            let msgError = `Impossible to find directory from env var: ${CHAINCODE_PEER_WALLET_FOLDER}`;
            logWrite(`[getFileSystemChaincodePeerWalletFolder] ${msgError}`);
            throw (msgError);
            // stop here
        }

        logWrite(`[getFileSystemChaincodePeerWalletFolder] wallet directory : ${place}`);

        return place;
    }

    static getHEX(){
        return HEX;
    }

    static getUTF8(){
        return UTF8;
    }

    static getBASE64(){
        return BASE64;
    }

    static getSHA256(){
        return SHA256;
    }

    static getALGORITSYMM(){
        return ALGORITSYMM;
    }

}

module.exports = BeanTransaction;

// END