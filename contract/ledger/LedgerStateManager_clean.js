#!/usr/bin/env node
'use strict';

const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');

const utf8 = BeanTransaction.getUTF8();
const msgErrorManager1 = 'Objeto ou chave passado para o controle do ledger Nulo ou Indefinido';

class LedgerStateManager {

    constructor(ctx, assetDescriptor) {
        this.ctx = ctx;
        this.assetName = assetDescriptor;
        this.supportedClasses = {};
    }

    use(stateClass) {
        this.supportedClasses[stateClass.getClass] = stateClass;
    }

    async addState(objState) {

        try {
            if (objState == null || objState == undefined) {
                throw msgErrorManager1;
            }

            let ledgerKey = objState.key;
            let ledgerData = JSON.stringify(objState);

            await this.ctx.stub.putState(ledgerKey, ledgerData);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }

    async getState(key) {

        try {
            if (key == null || key == undefined) {
                throw msgErrorManager1;
            }

            let dataBufferFromLedger = await this.ctx.stub.getState(key);

            if (dataBufferFromLedger == null || dataBufferFromLedger == undefined) {
                return null;
            }

            var jSonAfterGetState = JSON.stringify(dataBufferFromLedger);
            let objState = BeanDataBlock.translateLedgerReceived(jSonAfterGetState);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }

    async updateState(objState) {

        try {
            if (objState == null || objState == undefined) {
                throw msgErrorManager1;
            }

            let ledgerKey = objState.key;
            let ledgerData = JSON.stringify(objState);

            await this.ctx.stub.putState(ledgerKey, ledgerData);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }

    async getHistoryForKey(key) {
        try {
            if (key == null || key == undefined) {
                throw msgErrorManager1;
            }

            let dataIterator = await this.ctx.stub.getHistoryForKey(key);
            if (dataIterator == null || dataIterator == undefined) {
                return null;
            }

            let historyTxArray = await this.getAllSnapshots(dataIterator, true);
            return historyTxArray;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }

    async getAllSnapshots(iterator, isHistorical) {

        let arrayOfSnapshots = [];
        var counter = 1;

        while (true) {

            let snapshot = await iterator.next();

            if (snapshot.value && snapshot.value.value.toString()) {

                let jsonSnap = {
                    transaction: { sequence: counter++ }
                };

                if (isHistorical && isHistorical === true) {

                    jsonSnap.transaction.id = snapshot.value.tx_id;
                    jsonSnap.transaction.timestamp = snapshot.value.timestamp;
                    jsonSnap.transaction.isdelete = snapshot.value.is_delete.toString();

                    try {
                        jsonSnap.transaction.value = JSON.parse(snapshot.value.value.toString(utf8));
                    } catch (err) {
                        jsonSnap.transaction.value = snapshot.value.value.toString(utf8);
                    }

                } else {
                    jsonSnap.transaction.key = snapshot.value.key;

                    try {
                        jsonSnap.transaction.record = JSON.parse(snapshot.value.value.toString(utf8));
                    } catch (err) {
                        jsonSnap.transaction.record = snapshot.value.value.toString(utf8);
                    }
                }

                arrayOfSnapshots.push(jsonSnap);
            }
            if (snapshot.done) {
                await iterator.close();
                return arrayOfSnapshots;
            }
        }
    }

    async deleteState(objState) {

        try {
            if (objState == null || objState == undefined) {
                throw msgErrorManager1;
            }

            let ledgerKey = objState.key;
            let dataState = await this.ctx.stub.getState(ledgerKey);

            if (dataState == null || dataState == undefined) {
                return null;
            }

            await this.ctx.stub.deleteState(ledgerKey);

            return objState;

        } catch (err) {
            console.log(err);
            console.log(err.stack);
            return err.toString();
        }
    }
}

module.exports = LedgerStateManager;
