#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const packageContract = 'biz.blockchain.notarize';

const logPrefix = '\n {BeanState} ';

const separator = ":";

const logActive = false;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * Basic state class, which gathers the minimum necessary to establish the serialization of the data.
 */
class BeanState {

    /**
     * Load default values for this class
     */
    constructor() {
        logWrite(packageContract + '.BeanState');
    }

    static getPackageContract() {
        return packageContract;
    }

    getKey() {
        return this.key;
    }

    setKey(newKey) {
        this.key = newKey;
    }

    /**
     * Join the keyParts to make a unififed string.
     * @param {string[]} keyParts Elements to pull together to make a key for the objects.
     */
    configKey(keyParts) {
        this.key = BeanState.makeKey(keyParts);
    }

    /**
     * Separate internal components and prepares a kind of composite key.
     */
    getSplitKey() {

        if (this.key == null || this.key == undefined) {
            logWrite(`[getSplitKey] getSplitKey >> this.key is NULL or UNDEFINED`)
            return;
        }

        return BeanState.splitKey(this.key);
    }

    /**
     * Join the keyParts to make a unififed string.
     * @param {string[]} keyParts Data components that can form a composite key. 
     */
     static makeKey(keyParts) {
        return keyParts.map(part => JSON.stringify(part)).join(separator);
    }

    static splitKey(key) {
        let arrayStr = key.split(separator);
        logWrite(`[splitKey] Array of Key Parts = ${arrayStr}`);

        return arrayStr;
    }

    serialize() {
        return BeanState.serialize(this);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    stringify(){
        return JSON.stringify(this);
    }

    /**
     * Convert object to buffer containing JSON data serialization
     * Typically used before putState()ledger API
     * @param {Object} object JSON object to serialize
     * @return {buffer} buffer with the data to store
     */
    static serialize(object) {
        return Buffer.from(JSON.stringify(object));
    }

    /**
     * Deserialize object into one of a set of supported JSON classes
     * i.e. Convert serialized data to JSON object
     * Typically used after getState() ledger API
     * @param {object} dataToDeserialize Data to deserialize into JSON object.
     * @param {string} supportedClasses The set of classes data can be serialized to the system.
     * @return {json} JSON with the data to store.
     */
    static deserialize(dataToDeserialize, supportedClasses) {

        logWrite(`[deserialize] supportedClasses = ${supportedClasses}`);
        logWrite(`[deserialize] data = ${dataToDeserialize}`);

        if (dataToDeserialize == null || dataToDeserialize == undefined) { return; }

        if (!BeanState.isJson(dataToDeserialize)) {
            logWrite(`[deserialize] data to deserialize Is Not JSon type`);
            return null;
        }

        let json = JSON.parse(dataToDeserialize);
        
        let objClass = supportedClasses[json.class];
        
        if (objClass == null || objClass == undefined) {
            throw new Error(`Unknown class of ${json.class}`);
        }
        
        let object = new (objClass)(json);

        return object;
    }

    /**
     * Deserialize object into specific object class
     * Typically used after getState() ledger API
     * @param {object} dataToDeserialize Data to deserialize into JSON object.
     * @param {object} objClass Object type that can be serialized to the system.
     * @return {json} JSON with the data to store.
     */
    static deserializeClass(dataToDeserialize, objClass) {

        logWrite(`[deserializeClass] objClass = ${objClass}`);
        logWrite(`[deserializeClass] dataToDeserialize = ${dataToDeserialize}`);

        if (dataToDeserialize == null || dataToDeserialize == undefined) { return; }

        let json = JSON.parse(dataToDeserialize.toString());
        let object = new (objClass)(json);
        return object;
    }

    /**
     * Check if the parameter is a JSON datatype.
     * @param {string} item 
     */
    static isJson(item) {
        
        (item = typeof item !== "string") ? JSON.stringify(item) : item;

        try {
            item = JSON.parse(item);
        } catch (e) {
            return false;
        }

        if (typeof item === "object" && item !== null) {
            return true;
        }

        return false;
    }


}

module.exports = BeanState;
