#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const LedgerStateManager = require('./LedgerStateManager.js');

const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');

const logPrefix = '\n {LedgerDocAsset} ';

const logActive = true;

//----------------------
const ASSETDESCRIPTOR = BeanTransaction.getContractName() + "-digitalasset";

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text){
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * 
 */
class LedgerDocAsset extends LedgerStateManager {

    /**
     * Load default values for this class
     * @param {Context} ctx Encapsulates the context of the smart contract into Hyperledger Fabric
     */
    constructor(ctx) {
        super(ctx, ASSETDESCRIPTOR);
        this.use(BeanDataBlock);
    }

    /**
     * 
     * @param {object} objDoc 
     */
    async addDocAsset(objDoc) {

        let objFromLedger = await this.addState(objDoc);

        return objFromLedger;
    }

    /**
     * 
     * @param {string} keyOfDoc 
     */
    async getDocAsset(keyOfDoc) {

        let objFromLedger = await this.getState(keyOfDoc);

        return objFromLedger;
    }

    /**
     * 
     * @param {string} keyOfDoc 
     */
    async getHistoryAsset(keyOfDoc) {

        let historyTxArray = await this.getHistoryForKey(keyOfDoc);

        return historyTxArray;
    }

    /**
     * 
     * @param {object} objDoc 
     */
    async updateDocAsset(objDoc) {
        
        let objFromLedger = await this.updateState(objDoc);
        
        return objFromLedger;
    }

    /**
     * 
     * @param {object} objDoc 
     */
    async deleteDocAsset(objDoc) {

        let objFromLedger = await this.deleteState(objDoc);
        
        return objFromLedger;
    }
}


module.exports = LedgerDocAsset;