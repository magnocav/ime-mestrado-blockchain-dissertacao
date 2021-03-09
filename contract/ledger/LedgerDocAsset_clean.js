#!/usr/bin/env node
'use strict';

const LedgerStateManager = require('./LedgerStateManager.js');
const BeanDataBlock = require('../lib/BeanDataBlock.js');
const BeanTransaction = require('../lib/BeanTransaction.js');

const ASSETDESCRIPTOR = BeanTransaction.getContractName() + '-digitalasset';

class LedgerDocAsset extends LedgerStateManager {

    constructor(ctx) {
        super(ctx, ASSETDESCRIPTOR);
        this.use(BeanDataBlock);
    }

    async addDocAsset(objDoc) {
        let objFromLedger = await this.addState(objDoc);
        return objFromLedger;
    }

    async getDocAsset(keyOfDoc) {
        let objFromLedger = await this.getState(keyOfDoc);
        return objFromLedger;
    }

    async getHistoryAsset(keyOfDoc) {
        let historyTxArray = await this.getHistoryForKey(keyOfDoc);
        return historyTxArray;
    }

    async updateDocAsset(objDoc) {
        let objFromLedger = await this.updateState(objDoc);
        return objFromLedger;
    }

    async deleteDocAsset(objDoc) {
        let objFromLedger = await this.deleteState(objDoc);
        return objFromLedger;
    }
}

module.exports = LedgerDocAsset;