#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const BeanState = require('./BeanState.js');

const logPrefix = '\n {UserId} ';

const logActive = true;

/**
 * Function to enable/disable logging of the system inside script.
 * @param {string} text Text to write in logging.
 */
function logWrite(text) {
    if (logActive) { console.log(logPrefix + text); }
}

/**
 * Class that encapsulates data and functions about UserId.
 */
class UserId extends BeanState {

    /**
     * Load default values for this class
     */
    constructor() {
        super();
        this.setName(undefined);
        this.setOrganization(undefined);
        this.setEmail(undefined);
        this.setMSP(undefined);
        this.setX509(undefined);
    };

    static newUserId() {
        return new UserId();
    }

    /**
     * Creates a new prototype of UserId receiving parameters.
     * @param {UserId} userId A kind of UserId configured with values.
     */
    static createUserId(userId) {

        let newInstance = new UserId();

        newInstance.setName(userId.name);
        newInstance.setOrganization(userId.organization);
        newInstance.setEmail(userId.email);
        newInstance.setMSP(userId.MSP);
        newInstance.setX509(userId.X509);

        return newInstance;
    }

    setName(name) {
        this.name = name;
    }

    setOrganization(organization) {
        this.organization = organization;
    }

    setEmail(email) {
        this.email = email;
    }

    setMSP(orgMSP) {
        this.MSP = orgMSP;
    }

    setX509(wX509) {
        this.X509 = wX509;
    }

    /**
     * Checks the equality between the parameter and this instance object.
     * @param {UserId} userId Object to be verified about equality.
     */
    equals(userId) {
        if (userId == null || userId == undefined) {
            return false;
        } else if (this.name != userId.name) {
            return false;
        } else if (this.organization != userId.organization) {
            return false;
        } else if (this.email != userId.email) {
            return false;
        } else if (this.MSP != userId.MSP) {
            return false;
        } else if (this.X509 != userId.X509) {
            return false;
        }

        logWrite(`[equals] UserId equals TRUE`);
        return true;
    }

}

module.exports = UserId;

// END