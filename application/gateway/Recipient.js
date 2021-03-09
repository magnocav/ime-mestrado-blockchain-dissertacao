#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const fs = require('fs');
const path = require('path');

const logPrefix = '\n {Recipient} ';

const logActive = true;

/**
 * 
 */
class Recipient {

    /**
     * 
     * @param {string} text 
     */
    static logWrite(text) {
        if (logActive) console.log(logPrefix + text);
    }

    constructor() {
        Recipient.logWrite('[constructor] Loaded ');
    }

    static newRecipient() {
        return new Recipient();
    }

    /**
     * 
     * @param {JSON} wallet 
     */
    async cleanSecurityWallet(wallet) {

        wallet.passphrase = '';
        wallet.keys.privateArmored = '';
        wallet.keys.revocationCertificate = '';

        return wallet;
    }

    /**
     * 
     * @param {string} dirWallets 
     */
    async getDestinations(dirWallets) {

        var destinationArray = new Array(3);

        var indice = 0;

        try {
            // Org: Guarani ---------------------------------------------------------------------------------------

            // Get recipient
            let kateData = fs.readFileSync(`${dirWallets}/guarani/kate/wallet-openpgp-kate@guarani.blockchain.biz.json`);
            let kateWallet = JSON.parse(kateData);
            kateWallet = await this.cleanSecurityWallet(kateWallet);
            Recipient.logWrite('[getDestinations] Kate input: ' + JSON.stringify(kateWallet));

            destinationArray[indice] = kateWallet;
            indice++;

            // Get recipient
            let lisaData = fs.readFileSync(`${dirWallets}/guarani/lisa/wallet-openpgp-lisa@guarani.blockchain.biz.json`);
            let lisaWallet = JSON.parse(lisaData);
            lisaWallet = await this.cleanSecurityWallet(lisaWallet);
            Recipient.logWrite('[getDestinations] Lisa input: ' + JSON.stringify(lisaWallet));

            destinationArray[indice] = lisaWallet;
            indice++;

            // Org: Ticcuna ---------------------------------------------------------------------------------------

            // Get recipient
            let tedData = fs.readFileSync(`${dirWallets}/ticcuna/ted/wallet-openpgp-ted@ticcuna.blockchain.biz.json`);
            let tedWallet = JSON.parse(tedData);
            tedWallet = await this.cleanSecurityWallet(tedWallet);
            Recipient.logWrite('[getDestinations] Ted input: ' + JSON.stringify(tedWallet));

            destinationArray[indice] = tedWallet;
            indice++;

            // Get recipient
            let suzanData = fs.readFileSync(`${dirWallets}/ticcuna/suzan/wallet-openpgp-suzan@ticcuna.blockchain.biz.json`);
            let suzanWallet = JSON.parse(suzanData);
            suzanWallet = await this.cleanSecurityWallet(suzanWallet);
            Recipient.logWrite('[getDestinations] Suzan input: ' + JSON.stringify(suzanWallet));

            destinationArray[indice] = suzanWallet;
            indice++;

            // Org: Xavante ---------------------------------------------------------------------------------------

            // Get recipient
            let fredData = fs.readFileSync(`${dirWallets}/xavante/fred/wallet-openpgp-fred@xavante.blockchain.biz.json`);
            let fredWallet = JSON.parse(fredData);
            fredWallet = await this.cleanSecurityWallet(fredWallet);
            Recipient.logWrite('[getDestinations] Fred input: ' + JSON.stringify(fredWallet));

            destinationArray[indice] = fredWallet;
            indice++;

            // Get recipient
            let nancyData = fs.readFileSync(`${dirWallets}/xavante/nancy/wallet-openpgp-nancy@xavante.blockchain.biz.json`);
            let nancyWallet = JSON.parse(nancyData);
            nancyWallet = await this.cleanSecurityWallet(nancyWallet);
            Recipient.logWrite('[getDestinations] Nancy input: ' + JSON.stringify(nancyWallet));

            destinationArray[indice] = nancyWallet;
            indice++;

        } catch (error) {
            Recipient.logWrite(error.stack);

            throw error;
        }

        return destinationArray;

    }

}

module.exports = Recipient;

// END