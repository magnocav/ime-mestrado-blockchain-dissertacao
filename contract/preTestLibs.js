#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

/**
 * This script is used to load classes and scripts in order to eval syntax in source-code.
 */

console.log("MGN >> Loading chaincode");

const util = require('util');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const openpgp = require('openpgp');
const mkdirp = require('mkdirp');

const { Contract, Context } = require('fabric-contract-api');
const shim = require('fabric-shim');

console.log("MGN >> Node libraries loaded");

// Organization Libraries
const ResponseModel = require('./lib/ResponseModel.js');
var preResponseModel = new ResponseModel();

const CryptoWalletPGPUtil = require('./lib/CryptoWalletPGPUtil.js');
var preCryptoWalletPGPUtil = new CryptoWalletPGPUtil();

const CryptoKeyUtil = require('./lib/CryptoKeyUtil.js');
var preCryptoKeyUtil = new CryptoKeyUtil();

const EccUtil = require('./lib/CryptoKeyUtil.js');
var preEccUtil = new EccUtil();

const KeyPair = require('./lib/KeyPair.js');
var preKeyPair = new KeyPair();

const UserId = require('./lib/UserId.js');
var preUserId = new UserId();

const BeanState = require('./lib/BeanState.js');
var preBeanState = new BeanState();

const BeanUser = require('./lib/BeanUser.js');
var preBeanUser = new BeanUser();

const BeanFileMessage = require('./lib/BeanFileMessage.js');
var preBeanFileMessage = new BeanFileMessage();

const BeanTransaction = require('./lib/BeanTransaction.js');
var preBeanTransaction = new BeanTransaction();

const BeanDataBlock = require('./lib/BeanDataBlock.js');
var preBeanDataBlock = new BeanDataBlock();

const LedgerDocAsset = require('./ledger/LedgerDocAsset.js');
var preLedgerDocAsset = new LedgerDocAsset(new Context());

const LedgerStateManager = require('./ledger/LedgerStateManager.js');
var preLedgerStateManager = new LedgerStateManager(new Context(), BeanDataBlock);

const NotarizeOps = require('./business/NotarizeOps.js');
var preNotarizeOps = new NotarizeOps();

console.log("MGN >> Local requirement classes loaded");

// Smart Contract
const NotarizeDocument = require('./business/NotarizeDocument.js');
var preNotarizeDocument = new NotarizeDocument();


module.exports.contracts = [NotarizeDocument];
