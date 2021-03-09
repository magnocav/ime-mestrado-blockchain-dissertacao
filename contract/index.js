#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

/**
 * This script is used to load smart contract into Hyperledger Fabric.
 */

console.log("MGN >> Loading chaincode");

// Smart Contract
const NotarizeDocument = require('./business/NotarizeDocument.js');
module.exports.contracts = [NotarizeDocument];