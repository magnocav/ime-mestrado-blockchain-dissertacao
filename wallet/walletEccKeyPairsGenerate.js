#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

/**
 * References
 * https://en.wikipedia.org/wiki/X.509#Structure_of_a_certificate
 * https://crypto.stackexchange.com/questions/11582/openpgp-x-509-bridge-how-to-verify-public-key?rq=1
 * http://www.spywarewarrior.com/uiuc/ss/revoke/pgp-revoke.htm
 */

const fs = require('fs');
const crypto = require('crypto');
const openpgp = require('openpgp');
const path = require('path');

const { FileSystemWallet, X509WalletMixin } = require('fabric-network');

const typeOfCertificate = 'PGP';

const ECDHTYPE = 'secp256k1';

const hex = 'hex';
const utf8 = 'utf-8';
const base64 = 'base64';
const sha256 = 'sha256';

console.log("Type:\t", ECDHTYPE);

const logPrefix = '\n {walletEccKeyPairsGenerate} ';

const genVersion = 1;
const prefixWallet = 'wallet-openpgp-';
const fileExt = '.json';


const User2GuaraniMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/guarani.blockchain.biz/users/User2@guarani.blockchain.biz/msp');
const User2GuaraniMspCertPem = path.join(User2GuaraniMsp, '/signcerts/User2@guarani.blockchain.biz-cert.pem');
const User2GuaraniMspKeyStoreDir = path.join(User2GuaraniMsp, '/keystore');
const User2GuaraniIdentityLabel = 'User2@guarani.blockchain.biz';

const User1GuaraniMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/guarani.blockchain.biz/users/User1@guarani.blockchain.biz/msp');
const User1GuaraniMspCertPem = path.join(User1GuaraniMsp, '/signcerts/User1@guarani.blockchain.biz-cert.pem');
const User1GuaraniMspKeyStoreDir = path.join(User1GuaraniMsp, '/keystore');
const User1GuaraniIdentityLabel = 'User1@guarani.blockchain.biz';

const AdminGuaraniMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/guarani.blockchain.biz/users/Admin@guarani.blockchain.biz/msp');
const AdminGuaraniMspCertPem = path.join(AdminGuaraniMsp, '/signcerts/Admin@guarani.blockchain.biz-cert.pem');
const AdminGuaraniMspKeyStoreDir = path.join(AdminGuaraniMsp, '/keystore');
const AdminGuaraniIdentityLabel = 'Admin@guarani.blockchain.biz';

const GuaraniMSP = 'GuaraniMSP';


const User2TiccunaMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/ticcuna.blockchain.biz/users/User2@ticcuna.blockchain.biz/msp');
const User2TiccunaMspCertPem = path.join(User2TiccunaMsp, '/signcerts/User2@ticcuna.blockchain.biz-cert.pem');
const User2TiccunaMspKeyStoreDir = path.join(User2TiccunaMsp, '/keystore');
const User2TiccunaIdentityLabel = 'User2@ticcuna.blockchain.biz';

const User1TiccunaMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/ticcuna.blockchain.biz/users/User1@ticcuna.blockchain.biz/msp');
const User1TiccunaMspCertPem = path.join(User1TiccunaMsp, '/signcerts/User1@ticcuna.blockchain.biz-cert.pem');
const User1TiccunaMspKeyStoreDir = path.join(User1TiccunaMsp, '/keystore');
const User1TiccunaIdentityLabel = 'User1@ticcuna.blockchain.biz';

const AdminTiccunaMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/ticcuna.blockchain.biz/users/Admin@ticcuna.blockchain.biz/msp');
const AdminTiccunaMspCertPem = path.join(AdminTiccunaMsp, '/signcerts/Admin@ticcuna.blockchain.biz-cert.pem');
const AdminTiccunaMspKeyStoreDir = path.join(AdminTiccunaMsp, '/keystore');
const AdminTiccunaIdentityLabel = 'Admin@ticcuna.blockchain.biz';

const TiccunaMSP = 'TiccunaMSP';


const User2XavanteMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/xavante.blockchain.biz/users/User2@xavante.blockchain.biz/msp');
const User2XavanteMspCertPem = path.join(User2XavanteMsp, '/signcerts/User2@xavante.blockchain.biz-cert.pem');
const User2XavanteMspKeyStoreDir = path.join(User2XavanteMsp, '/keystore');
const User2XavanteIdentityLabel = 'User2@xavante.blockchain.biz';

const User1XavanteMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/xavante.blockchain.biz/users/User1@xavante.blockchain.biz/msp');
const User1XavanteMspCertPem = path.join(User1XavanteMsp, '/signcerts/User1@xavante.blockchain.biz-cert.pem');
const User1XavanteMspKeyStoreDir = path.join(User1XavanteMsp, '/keystore');
const User1XavanteIdentityLabel = 'User1@xavante.blockchain.biz';

const AdminXavanteMsp = path.resolve(__dirname, '../crypto-config/peerOrganizations/xavante.blockchain.biz/users/Admin@xavante.blockchain.biz/msp');
const AdminXavanteMspCertPem = path.join(AdminXavanteMsp, '/signcerts/Admin@xavante.blockchain.biz-cert.pem');
const AdminXavanteMspKeyStoreDir = path.join(AdminXavanteMsp, '/keystore');
const AdminXavanteIdentityLabel = 'Admin@xavante.blockchain.biz';

const XavanteMSP = 'XavanteMSP';

/**
 * Establishes the constants that will be used to generate the wallets
 */
const userType = {
  simple: 'simple',
  validator: 'validator',
  admin: 'administrator'
};

/**
 * Handles the correct path configuration on the file system
 * @param {string} pathOfDir Path in the file system
 */
function getMspKeyPath(pathOfDir) {

  let pathKeyStore = undefined;

  if (!fs.existsSync(pathOfDir)) {
    return pathKeyStore;
  }

  let fileArray = fs.readdirSync(pathOfDir);

  if (fileArray != undefined && fileArray != null && fileArray.length > 0) {
    pathKeyStore = path.join(pathOfDir, fileArray[0].toString());
  }

  return pathKeyStore;
}

/**
 * Generates a password randomly
 */
function generatePassword() {

  let pwdRandom = crypto.randomBytes(512);
  let pwdB64 = Buffer.from(pwdRandom).toString(base64);

  let hashFactory = crypto.createHash(sha256);;

  let passHash = hashFactory.update(pwdB64).digest(hex);

  return passHash;
}

/**
 * Create a certificate that integrates a wallet and is customized for use by OpenPGP
 * @param {JSON} protoWallet Initial information for a specific user to create their wallet
 */
async function createCertificate(protoWallet) {

  let password = generatePassword();
  let eventDate = new Date().toISOString;

  let pName = protoWallet.name;
  let pOrganization = protoWallet.organization;
  let pEmail = protoWallet.email;
  let pType = protoWallet.type;

  let pMsp = pOrganization + 'MSP';

  let certificate = {
    type: typeOfCertificate,
    version: genVersion,
    userId: {
      name: pName,
      organization: pOrganization,
      email: pEmail,
      MSP: pMsp,
      X509: '',
      type: pType
    },
    passphrase: password,
    keys: {
      created: eventDate,
      publicArmored: undefined,
      privateArmored: undefined,
      revocationCertificate: undefined
    }
  };

  return certificate;
}

/**
 * Links with the Hyperledger Fabric X509 certificate and writes the OpenPGP wallet to the file system.
 * @param {JSON} certificate Data containing the OpenPGP certificate template
 */
async function writeKeysToFile(certificate) {

  var fileDirPath = undefined;

  try {
    // console.log(logPrefix + " [writeKeysToFile]  certificate JSON: " + JSON.stringify(certificate));

    let orgDir = './' + certificate.userId.organization;
    orgDir = orgDir.toLowerCase();

    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir);
    }

    let personaDir = orgDir + '/' + certificate.userId.name;
    personaDir = personaDir.toLowerCase();

    if (!fs.existsSync(personaDir)) {
      fs.mkdirSync(personaDir);
    }


    let identity = undefined;
    let identityLabel = undefined;
    let identityMSP = undefined;

    let certPemTemp = undefined;
    let keyStoreDir = undefined;

    if (certificate.userId.MSP == GuaraniMSP) {

      identityMSP = GuaraniMSP;

      if (certificate.userId.type == userType.simple) {

        identityLabel = User2GuaraniIdentityLabel;
        certPemTemp = User2GuaraniMspCertPem.toString();
        keyStoreDir = User2GuaraniMspKeyStoreDir.toString();

      } else if (certificate.userId.type == userType.validator) {

        identityLabel = User1GuaraniIdentityLabel;
        certPemTemp = User1GuaraniMspCertPem.toString();
        keyStoreDir = User1GuaraniMspKeyStoreDir.toString();

      } else {

        identityLabel = AdminGuaraniIdentityLabel;
        certPemTemp = AdminGuaraniMspCertPem.toString();
        keyStoreDir = AdminGuaraniMspKeyStoreDir.toString();

      }
    } else if (certificate.userId.MSP == TiccunaMSP) {

      identityMSP = TiccunaMSP;

      if (certificate.userId.type == userType.simple) {

        identityLabel = User2TiccunaIdentityLabel;
        certPemTemp = User2TiccunaMspCertPem.toString();
        keyStoreDir = User2TiccunaMspKeyStoreDir.toString();

      } else if (certificate.userId.type == userType.validator) {

        identityLabel = User1TiccunaIdentityLabel;
        certPemTemp = User1TiccunaMspCertPem.toString();
        keyStoreDir = User1TiccunaMspKeyStoreDir.toString();

      } else {

        identityLabel = AdminTiccunaIdentityLabel;
        certPemTemp = AdminTiccunaMspCertPem.toString();
        keyStoreDir = AdminTiccunaMspKeyStoreDir.toString();

      }
    } else if (certificate.userId.MSP == XavanteMSP) {

      identityMSP = XavanteMSP;

      if (certificate.userId.type == userType.simple) {

        identityLabel = User2XavanteIdentityLabel;
        certPemTemp = User2XavanteMspCertPem.toString();
        keyStoreDir = User2XavanteMspKeyStoreDir.toString();

      } else if (certificate.userId.type == userType.validator) {

        identityLabel = User1XavanteIdentityLabel;
        certPemTemp = User1XavanteMspCertPem.toString();
        keyStoreDir = User1XavanteMspKeyStoreDir.toString();

      } else {

        identityLabel = AdminXavanteIdentityLabel;
        certPemTemp = AdminXavanteMspCertPem.toString();
        keyStoreDir = AdminXavanteMspKeyStoreDir.toString();

      }
    }

    // Remove temporary user type configuration
    certificate.userId.type = undefined;

    let cert = fs.readFileSync(certPemTemp).toString();
    let keystore = fs.readFileSync(getMspKeyPath(keyStoreDir)).toString();

    // A wallet to store a collection of Fabric identities
    let wallet = new FileSystemWallet(personaDir.toString());

    identity = X509WalletMixin.createIdentity(identityMSP, cert, keystore);

    // Add X.509 designation to the certificate
    certificate.userId.X509 = identityLabel;

    // Load credentials into wallet
    await wallet.import(identityLabel, identity);

    fileDirPath = personaDir + '/' + prefixWallet + certificate.userId.email + fileExt;
    fileDirPath = fileDirPath.toLowerCase();

  } catch (error) {
    console.log(error);
    console.log(error.stack);
    throw error.toString();
  }


  /**
   * Generates asymmetric encryption keys, based on the elliptical curve algorithm
   */
  await openpgp.generateKey({

    userIds: certificate.userId,
    curve: ECDHTYPE,
    passphrase: certificate.passphrase

  }).then(function (key) {

    // certificate.keys.created = key.key.keyPacket.created;
    certificate.keys.publicArmored = key.publicKeyArmored;
    certificate.keys.privateArmored = key.privateKeyArmored;
    certificate.keys.revocationCertificate = key.revocationCertificate;

  }).then(function () {

    let content = Buffer.from(JSON.stringify(certificate));
    fs.writeFileSync(fileDirPath, content.toString(), utf8);

    return certificate;

  }).catch((e) => {
    console.log(e);
    console.log(e.stack);
    throw e.toString();
  });

}

// ----------==========------------===========---------------


/**
 * Main program function that calls the other functions
 */
async function main() {

  try {

    let aliceCert = writeKeysToFile(await createCertificate({ name: 'Alice', organization: 'Guarani', email: 'alice@guarani.blockchain.biz', type: userType.simple }));

    let kateCert = writeKeysToFile(await createCertificate({ name: 'Kate', organization: 'Guarani', email: 'kate@guarani.blockchain.biz', type: userType.simple }));

    let lisaCert = writeKeysToFile(await createCertificate({ name: 'Lisa', organization: 'Guarani', email: 'lisa@guarani.blockchain.biz', type: userType.simple }));

    let validatorCert = writeKeysToFile(await createCertificate({ name: 'Validator', organization: 'Guarani', email: 'validator@guarani.blockchain.biz', type: userType.validator }));

  } catch (err) {
    console.error(err);
  }

  try {

    let bobCert = writeKeysToFile(await createCertificate({ name: 'Bob', organization: 'Ticcuna', email: 'bob@ticcuna.blockchain.biz', type: userType.simple }));

    let suzanCert = writeKeysToFile(await createCertificate({ name: 'Suzan', organization: 'Ticcuna', email: 'suzan@ticcuna.blockchain.biz', type: userType.simple }));

    let tedCert = writeKeysToFile(await createCertificate({ name: 'Ted', organization: 'Ticcuna', email: 'ted@ticcuna.blockchain.biz', type: userType.simple }));

    let validatorCert = writeKeysToFile(await createCertificate({ name: 'Validator', organization: 'Ticcuna', email: 'validator@ticcuna.blockchain.biz', type: userType.validator }));

  } catch (err) {
    console.error(err);
  }

  try {

    let bobCert = writeKeysToFile(await createCertificate({ name: 'Chan', organization: 'Xavante', email: 'chan@xavante.blockchain.biz', type: userType.simple }));

    let suzanCert = writeKeysToFile(await createCertificate({ name: 'Fred', organization: 'Xavante', email: 'fred@xavante.blockchain.biz', type: userType.simple }));

    let tedCert = writeKeysToFile(await createCertificate({ name: 'Nancy', organization: 'Xavante', email: 'nancy@xavante.blockchain.biz', type: userType.simple }));

    let validatorCert = writeKeysToFile(await createCertificate({ name: 'Validator', organization: 'Xavante', email: 'validator@xavante.blockchain.biz', type: userType.validator }));

  } catch (err) {
    console.error(err);
  }

  return;

}

// Execution
main().then(() => {
  console.log(logPrefix + '-- KEYS GENERATE PROCESS END --');
}).catch((e) => {
  console.log(e);
  console.log(e.stack);
  process.exit(-1);
});


// END
