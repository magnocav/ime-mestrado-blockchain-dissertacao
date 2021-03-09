#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const BeanState = require('../lib/BeanState.js');
const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');

const utf8 = BeanTransaction.getUTF8();

const logPrefix = '\n {LedgerStateManager} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

const msgErrorManager1 = `Object or Key passed to Ledger Manager is NULL or UNDEFINED`;

/**
 * LedgerStateManager provides a named virtual container for a set of ledger states.
 * Each state has a unique key which associates it with the container, rather
 * than the container containing a link to the state. 
 * This minimizes collisions for parallel transactions on different states.
 */
class LedgerStateManager {

    // https://github.com/hyperledger/fabric-samples/blob/release-1.4/chaincode/marbles02/node/marbles_chaincode.js#L243-L295
    // https://stackoverflow.com/questions/54935877/getstatebypartialcompositekey-is-retuning-me-object-which-is-non-iterable

    /**
     * Store Fabric context for subsequent API access, and name of asset list
     */
    constructor(ctx, assetDescriptor) {
        this.ctx = ctx;
        this.assetName = assetDescriptor;
        this.supportedClasses = {};
    }


    /**
     * Stores the class for future deserialization from ledger.
     * @param {string} stateClass A set of classes about state object.
     */
    use(stateClass) {
        this.supportedClasses[stateClass.getClass] = stateClass;
    }

  
    /**
     * Add a state to the list. Creates a new state in worldstate with
     * appropriate composite key.  Note that state defines its own key.
     * BeanState object is serialized before writing.
     * @param {object} objState Object to be added to the blockchain.
     */
    async addState(objState) {

        try {
            if (objState == null || objState == undefined) {
                logWrite(`[addState] Message: ${msgErrorManager1}`);
                throw msgErrorManager1;
            }

            let ledgerKey = objState.key;
            let ledgerData = JSON.stringify(objState);

            logWrite(`[addState] (ledgerData) before -> tx.stub.putState = ${ledgerData}`);

            await this.ctx.stub.putState(ledgerKey, ledgerData);

            logWrite(`[addState] (objState.key) before return to caller = ${objState.key}`);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }


    /**
     * Get a state from the list using supplied keys. 
     * Form composite keys to retrieve state from world state. 
     * BeanState data is deserialized into JSON object before being returned.
     * @param {string} key Value of a document stored in blockchain. 
     */
    async getState(key) {

        try {
            if (key == null || key == undefined) {
                logWrite(`[getState] Message: ${msgErrorManager1}`);
                throw msgErrorManager1;
            }

            logWrite(`[getState] (key) before -> ctx.stub.getState = ${key} `);

            let dataBufferFromLedger = await this.ctx.stub.getState(key);

            if (dataBufferFromLedger == null || dataBufferFromLedger == undefined) {
                return null;
            }

            var jSonAfterGetState = JSON.stringify(dataBufferFromLedger);

            let objState = BeanDataBlock.translateLedgerReceived(jSonAfterGetState);

            logWrite(`[getState] (objState.key) = ${objState.key}`);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }

    
    
    /**
     * Update a state in the list. 
     * Puts the new state in world state with appropriate composite key.
     * Note that state defines its own key.
     * A state is serialized before writing. 
     * Logic is very similar to addState() but kept separate becuase it is semantically distinct.
     * @param {object} objState Object to be updated to the blockchain.
     */
    async updateState(objState) {

        try {
            if (objState == null || objState == undefined) {
                logWrite(`[updateState] ${msgErrorManager1}`);
                throw msgErrorManager1;
            }

            let ledgerKey = objState.key;
            let ledgerData = JSON.stringify(objState);

            logWrite(`[updateState] (ledgerData) before -> ctx.stub.putState = ${ledgerData}`);

            await this.ctx.stub.putState(ledgerKey, ledgerData);

            logWrite(`[updateState] (objState.key) before return to caller = ${objState.key}`);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }



    /**
     * Get the history about one specific key in the ledger.
     * Returns an array of transaction snapshots.
     * @param {string} key Value of a document stored in blockchain.
     */
    async getHistoryForKey(key) {
        try {
            if (key == null || key == undefined) {
                logWrite(`[getHistoryForKey] Message: ${msgErrorManager1}`);
                throw msgErrorManager1;
            }

            logWrite(`[getHistoryForKey] (key) before -> ctx.stub.getHistoryForKey = ${key} `);

            let dataIterator = await this.ctx.stub.getHistoryForKey(key);

            if (dataIterator == null || dataIterator == undefined) {
                return null;
            }

            let historyTxArray = await this.getAllSnapshots(dataIterator, true);

            logWrite(`[getHistoryForKey] (key) = ${key}`);

            return historyTxArray;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }


    /**
     * Iterates an iterator to organize dataset, in order to view a collection of blockchain data.
     * @param {iterator} iterator A collection of blockchain data that can be iterated for inspection and visualization.
     * @param {boolean} isHistorical Flag marking as historical dataset.
     */
    async getAllSnapshots(iterator, isHistorical) {

        let arrayOfSnapshots = [];

        var counter = 1;

        while (true) {

            let snapshot = await iterator.next();

            if (snapshot.value && snapshot.value.value.toString()) {
                
                let jsonSnap = {
                    transaction: { sequence: counter++ }
                };

                logWrite('[getAllSnapshots] snapshot.value.value = '+ snapshot.value.value.toString(utf8));

                if (isHistorical && isHistorical === true) {
                    
                    jsonSnap.transaction.id = snapshot.value.tx_id;
                    jsonSnap.transaction.timestamp = snapshot.value.timestamp;
                    jsonSnap.transaction.isdelete = snapshot.value.is_delete.toString();
                    
                    try {
                        jsonSnap.transaction.value = JSON.parse(snapshot.value.value.toString(utf8));
                    } catch (err) {
                        logWrite(`[getAllSnapshots] Message: ${err}`);
                        jsonSnap.transaction.value = snapshot.value.value.toString(utf8);
                    }

                } else {
                    jsonSnap.transaction.key = snapshot.value.key;
                    
                    try {
                        jsonSnap.transaction.record = JSON.parse(snapshot.value.value.toString(utf8));
                    } catch (err) {
                        logWrite(`[getAllSnapshots] Message: ${err}`);
                        jsonSnap.transaction.record = snapshot.value.value.toString(utf8);
                    }
                }
                logWrite(`[getAllSnapshots] Individual snapshot history: \n ${JSON.stringify(jsonSnap)}`);

                arrayOfSnapshots.push(jsonSnap);
            }
            if (snapshot.done) {
                logWrite(`[getAllSnapshots] Data end registry`);
                await iterator.close();

                return arrayOfSnapshots;
            }
        }
    }



    /**
     * Delete a state in the list.
     * 
     * https://stackoverflow.com/questions/43623517/how-does-delstate-work-in-fabric
     * 
     * There is a state database that stores keys and their values. This is different from 
     * the sequence of blocks that make up the blockchain. A key and its associated value 
     * can be removed from the state database using the DelState function. However, this 
     * does not mean that there is an alteration of blocks on the blockchain. 
     * The removal of a key and value would be stored as a transaction on the blockchain 
     * just as the prior addition and any modifications were stored as transactions on 
     * the blockchain.
     * @param {object} objState Object to be marked as deleted to the blockchain. 
     */
    async deleteState(objState) {

        try {
            if (objState == null || objState == undefined) {
                logWrite(`[deleteState] ${msgErrorManager1}`);
                throw msgErrorManager1;
            }

            let ledgerKey = objState.key;
            logWrite(`[deleteState] (ledgerKey) before -> ctx.stub.getState = ${ledgerKey} `);

            let dataState = await this.ctx.stub.getState(ledgerKey);

            if (dataState == null || dataState == undefined) {
                return null;
            }

            logWrite(`[deleteState] (dataState) after -> ctx.stub.getState = ${JSON.stringify(dataState)}`);

            await this.ctx.stub.deleteState(ledgerKey);

            logWrite(`[deleteState] (objState.key) before return to caller = ${objState.key}`);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }
}

module.exports = LedgerStateManager;
