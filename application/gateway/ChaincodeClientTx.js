#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { FileSystemWallet, Gateway } = require('fabric-network');

const { promisify } = require('util');
const sleep = promisify(setTimeout);
const waitingTime = 500;

const CHANNELNAME = 'devchannel';

const ContractNotarizeDocument = "ContractNotarizeDocument";

const HEX = 'hex';
const UTF8 = 'utf8';
const BASE64 = 'base64';
const SHA256 = 'sha256';

const logPrefix = '\n {ChaincodeClientTx} ';

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
class ChaincodeClientTx {

    /**
     * 
     */
    static getChannelName() {
        return CHANNELNAME;
    }


    /**
     * 
     * @param {string} dirWallets Directory with wallet PGP.
     * @param {string} organizationName Organization name.
     * @param {string} walletName Wallet user name.
     * @param {string} transaction Transaction name.
     * @param {string} contractName Smart-contract (chaincode) name.
     * @param {string} pathGatewayFile File path to the file with gateway information about blockchain access point.
     */
    constructor(dirWallets, organizationName, walletName, transaction, contractName, pathGatewayFile) {

        let errorMessage = `\n All parameters must be set. `;
        let erroFlag = false;

        if (organizationName == undefined || organizationName == null) {
            errorMessage = errorMessage + ` Organization Name is undefined. `;
            erroFlag = true;
        }

        if (dirWallets == undefined || dirWallets == null) {
            errorMessage = errorMessage + ` Wallet Folder Path is undefined. `;
            erroFlag = true;
        }

        if (walletName == undefined || walletName == null) {
            errorMessage = errorMessage + ` Wallet Name is undefined. `;
            erroFlag = true;
        }

        if (transaction == undefined || transaction == null) {
            errorMessage = errorMessage + ` Transaction Name is undefined. `;
            erroFlag = true;
        }

        if (contractName == undefined || contractName == null) {
            errorMessage = errorMessage + ` Contract Name is undefined. `;
            erroFlag = true;
        }

        if (pathGatewayFile == undefined || pathGatewayFile == null) {
            errorMessage = errorMessage + ` Gateway File Config Path is undefined. `;
            erroFlag = true;
        }

        if (erroFlag) {
            throw errorMessage;
        }

        this.organizationName = organizationName;
        this.dirWallets = dirWallets;
        this.walletName = walletName;
        this.transaction = transaction;
        this.contractName = contractName;
        this.gatewayFileConfig = pathGatewayFile;
    }

    /**
     * 
     * @param {string} dirWallets Directory with wallet PGP.
     * @param {string} organizationName Organization name.
     * @param {string} walletName Wallet user name.
     * @param {string} transaction Transaction name.
     * @param {string} contractName Smart-contract (chaincode) name.
     * @param {string} pathGatewayFile File path to the file with gateway information about blockchain access point.
     */
    static newChaincodeClientTx(dirWallets, organizationName, walletName, transaction, contractName, pathGatewayFile) {

        logWrite(`[newChaincodeClientTx] dirWallets: ${dirWallets} ; organizationName: ${organizationName}; walletName: ${walletName}; 
            transaction: ${transaction}; contractName: ${contractName}; pathOfGatewayConfig: ${pathGatewayFile}`);

        return new ChaincodeClientTx(dirWallets, organizationName, walletName, transaction, contractName, pathGatewayFile);
    }


    /**
     * 
     * @param {string} dirWallets509 
     * @param {string} organizationName509 
     * @param {string} walletName509 
     */
    async getWalletX509Config(dirWallets509, organizationName509, walletName509) {

        if (organizationName509 == undefined || organizationName509 == null) {
            throw 'Organization Name is undefined';
        }

        if (dirWallets509 == undefined || dirWallets509 == null) {
            throw 'Wallet Folder Path is undefined';
        }

        if (walletName509 == undefined || walletName509 == null) {
            throw 'Wallet Name is undefined';
        }

        let mountPath = `${dirWallets509}/${organizationName509}/${walletName509}`;

        let walletPath = path.resolve(mountPath.toString());

        logWrite(`[getWalletX509Config] walletPath: ${walletPath}`);

        var walletX509 = undefined;

        try {

            walletX509 = new FileSystemWallet(walletPath);

        } catch (error) {
            logWrite(`[getWalletX509Config] Error processing wallet >> ${error}`);
            logWrite(error.stack);
            throw error;
        }

        return walletX509;
    }


    /**
     * 
     * @param {string} dirWallets509 
     * @param {string} organizationName509 
     * @param {string} walletName509 
     */
    async getIdentityInFileSystemWalletX509(dirWallets509, organizationName509, walletName509) {

        if (organizationName509 == undefined || organizationName509 == null) {
            throw 'Organization Name is undefined';
        }

        if (dirWallets509 == undefined || dirWallets509 == null) {
            throw 'Wallet Folder Path is undefined';
        }

        if (walletName509 == undefined || walletName509 == null) {
            throw 'Wallet Name is undefined';
        }

        let mountPath = `${dirWallets509}/${organizationName509}/${walletName509}`;

        let walletPath = path.resolve(mountPath.toString());

        logWrite(`[getIdentityInFileSystemWalletX509] walletPath: ${walletPath}`);

        var identityNameFromWalletX509 = undefined;

        try {
            let fileArray = fs.readdirSync(walletPath);

            if (fileArray != undefined && fileArray != null && fileArray.length > 0) {
                for (var i = 0; i < fileArray.length; i++) {
                    let objName = fileArray[i];

                    if (objName.indexOf('@') > -1) {
                        identityNameFromWalletX509 = objName;
                        i = fileArray.length + 2;
                    }
                }
            }
        } catch (error) {
            logWrite(`[getIdentityInFileSystemWalletX509] Error processing search >> ${error}`);
            logWrite(error.stack);
            throw error;
        }

        return identityNameFromWalletX509;
    }


    /**
     * 
     * @param {string} identityLabel 
     * @param {string} walletX509 
     * @param {BeanDataBlock} dataToSubmit 
     */
    async doFabricTransaction(identityLabel, walletX509, dataToSubmit) {

        // Wait small time to avoid concorrency runway
        await sleep(waitingTime);

        // A gateway defines the peers used to access Fabric networks
        var gateway = new Gateway();

        var response = undefined;

        try {

            // Set connection options; identity and wallet
            // https://hyperledger-fabric.readthedocs.io/en/release-1.4/developapps/connectionoptions.html
            let connectionOptions = {
                identity: identityLabel, // Specify identity for network access
                wallet: walletX509,
                discovery: { enabled: false, asLocalhost: false }
                /*
                eventHandlerOptions: {
                        commitTimeout: 100,
                        strategy: EventStrategies.MSPID_SCOPE_ANYFORTX
                    },
                */
            };

            logWrite(`[doFabricTransaction] gatewayFileConfig: ${this.gatewayFileConfig}`);

            // Load connection profile; will be used to locate a gateway
            let connectionProfile = await yaml.safeLoad(fs.readFileSync(this.gatewayFileConfig, UTF8));

            // Connect to gateway using application specified parameters
            await gateway.connect(connectionProfile, connectionOptions);

            // Access channel in blockchain network
            var network = await gateway.getNetwork(CHANNELNAME);

            // Get addressability to smart contract
            var contract = await network.getContract(this.contractName, ContractNotarizeDocument);

            if (contract == null || contract == undefined) {
                let msgError = `Impossible to get contract as ${this.contractName}`;
                logWrite(`[doFabricTransaction] Message: ${msgError}]`);
                throw msgError;
            }

            logWrite(`[doFabricTransaction] Before submit transaction, the Transaction is: ${this.transaction}`);

            // Process the transaction 
            response = await contract.submitTransaction(this.transaction, dataToSubmit);

            logWrite('[doFabricTransaction] Transaction complete.');

        } catch (error) {

            logWrite(`[doFabricTransaction] Error processing transaction >> ${error}`);
            logWrite(error.stack);

        } finally {

            // Disconnect from the gateway
            logWrite('[doFabricTransaction] Disconnect from Fabric gateway.');

            gateway.disconnect();
        }

        return response;
    }


    /**
     * 
     * @param {BeanDataBlock} dataToSubmit 
     */
    async processBlockchainTransaction(dataToSubmit) {

        if (dataToSubmit == null || dataToSubmit == undefined) {
            let msgError = `Data To Submit is NUll or UNDEFINED`;
            logWrite(`[processBlockchainTransaction] Message: ${msgError}`);
            throw msgError;
        }

        // A wallet stores a collection of identities for use
        var walletX509 = await this.getWalletX509Config(this.dirWallets, this.organizationName, this.walletName);

        var identityLabel = await this.getIdentityInFileSystemWalletX509(this.dirWallets, this.organizationName, this.walletName);

        dataToSubmit = JSON.stringify(dataToSubmit);

        // Performs data transmission to the ledger
        logWrite(`[processBlockchainTransaction] Process the data transmission to the ledger`);

        var response = await this.doFabricTransaction(identityLabel, walletX509, dataToSubmit);

        logWrite(`[processBlockchainTransaction] After Ledger Response`);

        return response;
    }


    /**
     * 
     * @param {BeanDataBlock} dataToSubmit 
     */
    async preProcessTest(dataToSubmit) {

        if (dataToSubmit == null || dataToSubmit == undefined) {
            let msgError = `Data To Submit is NUll or UNDEFINED`;
            logWrite(`[preProcessTest] Message: ${msgError}`);
            throw msgError;
        }

        // A wallet stores a collection of identities for use
        var walletX509 = await this.getWalletX509Config(this.dirWallets, this.organizationName, this.walletName);

        var identityLabel = await this.getIdentityInFileSystemWalletX509(this.dirWallets, this.organizationName, this.walletName);

        logWrite(`[preProcessTest] dataToSubmit: ${JSON.stringify(dataToSubmit)}`);

        return true;
    }

}

module.exports = ChaincodeClientTx;

// END