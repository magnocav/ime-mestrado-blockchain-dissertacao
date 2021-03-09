#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const BeanState = require('./BeanState.js');

const logPrefix = '\n {KeyPair} ';

/**
 * 
 */
class KeyPair extends BeanState{
    
    /**
     * Load default values for this class
     */
    constructor(){
        super();
        this.setPublicArmored(undefined);
        this.setPrivateArmored(undefined);
        this.setRevocationCertificate(undefined);
    }

    static newKeyPair(){
        return new KeyPair();
    }

    /**
     * Creates a new prototype of KeyPair receiving parameters.
     * @param {KeyPair} keys A kind of KeyPair configured with values. 
     */
    static createKeyPair(keys){

        let newInstance = new KeyPair();
        
        newInstance.setPublicArmored(keys.publicArmored);
        newInstance.setPrivateArmored(keys.privateArmored);
        newInstance.setRevocationCertificate(keys.revocationCertificate);
        
        return newInstance;
    }

    setPublicArmored(publicArmored){
        this.publicArmored = publicArmored;
    }

    setPrivateArmored(privateArmored){
        this.privateArmored = privateArmored;
    }

    setRevocationCertificate(revocationCertificate){
        this.revocationCertificate = revocationCertificate;
    }

    /**
     * Prevents the private dataset from being inside the user's data before transmission through unsecure channel.
     */
    clearSecurityData(){
        this.setPrivateArmored(undefined);
        this.setRevocationCertificate(undefined);
    }

}

module.exports = KeyPair;

// END