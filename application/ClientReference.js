#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const GatewayFileConfigGuarani = './gateway/devchannelConnectionGuarani.yaml';
const orgGuarani = 'guarani';

const GatewayFileConfigTiccuna = './gateway/devchannelConnectionTiccuna.yaml';
const orgTiccuna = 'ticcuna';

const GatewayFileConfigXavante = './gateway/devchannelConnectionXavante.yaml';
const orgXavante = 'xavante';

const FileBase64BeforeIssue = './blk-FileContentBase64-before-issued.txt';

const FileBase64ReadAfterDecrypt = './blk-FileContentBase64-read-after-decrypt.txt';

//=======================

const JsonSubmitToIssue = './blockdata-submit-to-issue.json';

const DocJsonIssued = './blockdata-issued.json';

const JsonSubmitToValidate = './blockdata-submit-to-validated.json';

const DocJsonValidated = './blockdata-validated.json';

const JsonSubmitToRead = './blockdata-submit-to-read.json';

const DocJsonRead = './blockdata-read.json';

const JsonSubmitToRetrieve = './blockdata-submit-to-retrieve.json';

const DocJsonRetrieved = './blockdata-retrieved.json';

const JsonSubmitToRevoke = './blockdata-submit-to-revoke.json';

const DocJsonRevoked = './blockdata-revoked.json';

const JsonSubmitToHistory = './blockdata-submit-to-history.json';

const DocJsonHistory = './blockdata-history.json';

/**
 * Class of parameter configuration to facilitate the control of 
 * connection to the blockchain network.
 */
class ClientReference {

    static newClientReference() {
        return new ClientReference();
    }

    static getGatewayFileConfigGuarani(){
        return GatewayFileConfigGuarani;
    }

    static getOrgGuarani(){
        return orgGuarani;
    }

    static getGatewayFileConfigTiccuna(){
        return GatewayFileConfigTiccuna;
    }

    static getOrgTiccuna(){
        return orgTiccuna;
    }

    static getGatewayFileConfigXavante(){
        return GatewayFileConfigXavante;
    }

    static getOrgXavante(){
        return orgXavante;
    }

    static getFileBase64BeforeIssue(){
        return FileBase64BeforeIssue;
    }

    static getFileBase64ReadAfterDecrypt(){
        return FileBase64ReadAfterDecrypt;
    }

    /**
     * Select from the name of the organization the configuration file of the gateway connecting to the blockchain network.
     * @param {string} organizatonName 
     */
    static chooseGatewayFromOrg(organizatonName){
        
        if (organizatonName == null || organizatonName == undefined){
            return ClientReference.getGatewayFileConfigGuarani();
        }

        if (organizatonName == ClientReference.getOrgGuarani()){
            return ClientReference.getGatewayFileConfigGuarani();

        } else if (organizatonName == ClientReference.getOrgTiccuna()){
            return ClientReference.getGatewayFileConfigTiccuna();

        } else if (organizatonName == ClientReference.getOrgXavante()){
            return ClientReference.getGatewayFileConfigXavante();

        } else {
            return ClientReference.getGatewayFileConfigGuarani();
        }
    }

    //=================

    static getJsonSubmitToIssue(){
        return JsonSubmitToIssue;
    }

    static getDocJsonIssued(){
        return DocJsonIssued;
    }

    static getJsonSubmitToValidate(){
        return JsonSubmitToValidate;
    }

    static getDocJsonValidated(){
        return DocJsonValidated;
    }

    static getJsonSubmitToRead(){
        return JsonSubmitToRead;
    }

    static getDocJsonRead(){
        return DocJsonRead;
    }

    static getJsonSubmitToRetrieve(){
        return JsonSubmitToRetrieve;
    }

    static getDocJsonRetrieved(){
        return DocJsonRetrieved;
    }

    static getJsonSubmitToRevoke(){
        return JsonSubmitToRevoke;
    }

    static getDocJsonRevoked(){
        return DocJsonRevoked;
    }

    static getJsonSubmitToHistory(){
        return JsonSubmitToHistory;
    }

    static getDocJsonHistory(){
        return DocJsonHistory;
    }

}

module.exports = ClientReference;