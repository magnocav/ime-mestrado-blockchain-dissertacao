#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const crypto = require('crypto');

const BeanState = require('./BeanState.js');
const BeanTransaction = require('./BeanTransaction.js');
const UserId = require('./UserId.js');
const KeyPair = require('./KeyPair.js');
const EccUtil = require('./CryptoKeyUtil.js');

const hex = BeanTransaction.getHEX();
const sha256 = BeanTransaction.getSHA256();

const logPrefix = '\n {BeanUser} ';

const logActive = true;

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
class BeanUser extends BeanState{
    
    /**
     * Load default values for this class
     */
    constructor(){
        //super(BeanState.getPackageContract() + ".BeanUser");
        super();
        
        this.setType(undefined);

        this.setVersion(undefined);

        this.setUserId(UserId.newUserId());

        this.setKeys(KeyPair.newKeyPair());

        this.setPassphrase(undefined);
        
        this.setPublicId(undefined);

        this.setPassword(undefined);

        this.setInitVector(undefined);

        this.setSignatureOfUserInfos(undefined);
    };

    static newBeanUser(){
        return new BeanUser();
    }

    /**
     * Creates a new prototype of BeanUser receiving parameters.
     * @param {BeanUser} user A kind of BeanUser configured with values.
     */
    static createBeanUser(user){
        
        let newInstance = new BeanUser();

        newInstance.setType(user.type);

        newInstance.setVersion(user.version);

        newInstance.setUserId(user.userId);

        newInstance.setKeys(user.keys);

        newInstance.setPassphrase(user.passphrase);

        newInstance.setPassword(user.password);

        newInstance.setInitVector(user.initVector);

        if (user.publicId != undefined && user.publicId != ''){
            newInstance.setPublicId(user.publicId);
        } else {
            newInstance.setPublicId(BeanUser.generateHashForPublicId(newInstance));
        }

        newInstance.setSignatureOfUserInfos(user.signatureOfUserInfos);
               
        return newInstance;
    }

    setType(type){
        this.type = type;
    }

    setVersion(version){
        this.version = version;
    }

    setUserId(userId){
        if (userId == undefined){
            this.userId = UserId.newUserId();
        } else {
            this.userId = UserId.createUserId(userId);
        }
    }

    setKeys(keys){
        if (keys == undefined){
            this.keys = KeyPair.newKeyPair();
        } else{
            this.keys = KeyPair.createKeyPair(keys);
        }
    }

    setPassphrase(passphrase){
        this.passphrase = passphrase;
    }

    setPublicId(publicId){
        this.publicId = publicId;
    }

    setSignatureOfUserInfos(signatureOfUserInfos){
        this.signatureOfUserInfos = signatureOfUserInfos;
    }

    setPassword(password){
        this.password = password;
    }

    setInitVector(initVector){
        this.initVector = initVector;
    }

    /**
     * Prevents the private dataset from being inside the user's data before transmission through unsecure channel.
     */
    clearSecurityData(){
        this.setPassphrase(undefined);
        this.keys.clearSecurityData();
    }

    /**
     * Checks the equality between the parameter and this instance object.
     * @param {BeanUser} bean Object to be verified about equality.
     */
    equals(bean){
        if (bean == null || bean == undefined){
            return false;
        } else if (this.type != bean.type){
            return false;
        } else if (this.version != bean.version){
            return false;
        } else if (this.publicId != bean.publicId){
            return false;
        } 
        
        let instanceUser = UserId.createUserId(this.userId);
        let beanUser = UserId.createUserId(bean.userId);
        
        if (!instanceUser.equals(beanUser)) {
            return false;
        }

        logWrite(`[equals] UserId equals TRUE`);
        return true;
    }

    /**
     * Generate the sender's public key hash value
     * A hash SHA-256 of keys.publicArmored
     * @param {BeanUser} user Source object to generate hash for Public Key.
     */
    static generateHashForPublicId(user){

        let publicId = '';

        if(user.publicId == undefined){
            let hashFactory = crypto.createHash(sha256);
            publicId = hashFactory.update(user.keys.publicArmored).digest(hex);
        }
        
        return publicId;
    }

    /**
     * 
     * @param {*} user 
     */
    static generateHashFromUserInfos(user){

        // Criar string para gerar hash com dados do User

        let { name, organization, email } = user.userId;

        let info = name + organization + email + user.publicId;

        logWrite('[generateHashFromUserInfos] ' + info);

        let hashFactory = crypto.createHash(sha256);
        let buffer = Buffer.from(info);
        let hashInfoPub = hashFactory.update(buffer).digest(hex);
        
        return hashInfoPub;
    }

    /**
     * 
     * @param {*} user 
     */
    static async generateSignatureOfUserInfos(user){

        // Remetente assina a concatenação de seus pŕoprios dados para evitar falsificação
        // Validador e Destinatario terão que validar essa assinatura
        let hashFromUserInfos = BeanUser.generateHashFromUserInfos(user);
        let buffer = Buffer.from(hashFromUserInfos);

        logWrite('[generateSignatureOfUserInfos] ' + buffer.toString());
        
        let signature = await EccUtil.signMessage(user, buffer.toString());

        logWrite('[generateSignatureOfUserInfos] ' + signature.toString());

        user.setSignatureOfUserInfos(signature);

        return user;
    }
}

module.exports = BeanUser;

// END