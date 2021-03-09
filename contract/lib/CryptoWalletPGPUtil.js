#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const fs = require('fs');
const path = require('path');

const logPrefix = '\n {CryptoWalletPGPUtil} ';

var walletPGP = undefined;

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * 
 */
class CryptoWalletPGPUtil {

    /**
     * Load default values for this class
     */
    constructor() {
        logWrite('[constructor] CryptoWalletPGPUtil Loaded ');
    }

    static newCryptoWalletPGPUtil() {
        return new CryptoWalletPGPUtil();
    }


    /**
     * 
     * @param {*} dirWallets 
     * @param {*} organizationName 
     * @param {*} walletName 
     */
    async configPGPWallet(dirWallets, organizationName, walletName) {

        let filePath = `${dirWallets}/${organizationName}/${walletName}/wallet-openpgp-${walletName}@${organizationName}.blockchain.biz.json`;

        let walletFilePath = path.resolve(filePath);

        logWrite(`[configPGPWallet] walletFilePath: ${walletFilePath}`);

        let walletData = fs.readFileSync(walletFilePath);

        if (walletData == null || walletData === undefined) {
            logWrite('[configPGPWallet] Wallet PGP Not Found');
            throw ('Wallet PGP Not Found');
            // stop here
        }

        this.walletPGP = JSON.parse(walletData);

        logWrite('[configPGPWallet] Wallet input: ' + JSON.stringify(this.walletPGP));

        return this.walletPGP;
    }


    setWalletPGP(newWalletPGP) {
        this.walletPGP = newWalletPGP;
    }

    getWalletPGPWithSecrety(newWalletPGP) {
        return this.walletPGP;
    }

    getCopyWalletPGPSecurityClean() {

        return this.cleanSecurityWallet(this.walletPGP);
    }

    configSecurityCleanWallet() {

        this.walletPGP.passphrase = undefined;
        this.walletPGP.keys.privateArmored = undefined;
        this.walletPGP.keys.revocationCertificate = undefined;
    }

    static cleanSecurityWallet(wallet) {

        let walletLocal = wallet;

        walletLocal.passphrase = undefined;
        walletLocal.keys.privateArmored = undefined;
        walletLocal.keys.revocationCertificate = undefined;

        return walletLocal;
    }
}

module.exports = CryptoWalletPGPUtil;

// END