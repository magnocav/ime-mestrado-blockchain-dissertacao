#!/usr/bin/env node
'use strict';

/*
# Author: Magno Alves Cavalcante < magno@cavalcante.eng.br >
#
# SPDX-License-Identifier: Apache-2.0
*/

const openpgp = require('openpgp');

const HEX = 'hex';
const BASE64 = 'base64';
const ECDHTYPE = 'secp256k1';

const logPrefix = '\n {CryptoKeyUtil} ';

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
class CryptoKeyUtil {

  /**
   * 
   * @param {*} sender 
   * @param {*} clearMessage 
   * @param {*} destination 
   */
  static async encryptMessage(sender, clearMessage, destination) {
  
    let publicKeyArmored = destination.keys.publicArmored;
    logWrite('[encryptMessage] publicKeyArmored: ' + publicKeyArmored);
  
    let privateKeyArmored = sender.keys.privateArmored; // encrypted private key 
    logWrite('[encryptMessage] privateKeyArmored: ' + privateKeyArmored);

    let passphrase = sender.passphrase; // what the private key is encrypted with
    logWrite('[encryptMessage] passphrase: ' + passphrase);

    logWrite('[encryptMessage] clearMessage: ' + clearMessage);

    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);

    const { data: encrypted } = await openpgp.encrypt({
        armor: true,
        compression: openpgp.enums.compression.zlib,
        message: await openpgp.message.fromText(clearMessage),                    // input as Message object
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
        privateKeys: [privateKey]                                           // for signing (optional)
      });

    logWrite('[encryptMessage] encrypted: ' + encrypted);

    return encrypted;
  }


  /**
   * 
   * @param {*} receiver 
   * @param {*} encryptedMessage 
   */
  static async decryptMessage(receiver, encryptedMessage) {
    
    // let publicKeyArmored = sender.keys.publicArmored;
  
    let privateKeyArmored = receiver.keys.privateArmored; // encrypted private key
  
    let passphrase = receiver.passphrase; // what the private key is encrypted with
  
    let { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
  
    let { data: decrypted } = await openpgp.decrypt({
      armor: true,
      compression: openpgp.enums.compression.zlib,
      message: await openpgp.message.readArmored(encryptedMessage),       // parse armored message
      //publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for verification (optional)
      privateKeys: [privateKey]                                           // for decryption
    });

    logWrite('[decryptMessage0] Msg decrypted: ' + decrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

    return decrypted;
  }


  /**
   * 
   * @param {*} persona 
   * @param {*} clearMessage 
   */
  static async signMessage(persona, clearMessage) {

    logWrite('[signMessage] persona: ' + JSON.stringify(persona));
    logWrite('[signMessage] clearMessage :' + clearMessage);
  
    let privateKeyArmored = persona.keys.privateArmored; // encrypted private key
    let passphrase = persona.passphrase; // what the private key is encrypted with

    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
  
    /*
    const { data: signed } = await openpgp.sign({
      message: openpgp.cleartext.fromText(clearMessage), // CleartextMessage or Message object
      privateKeys: [privateKey]                             // for signing
    });
    */

    const { signature: detachedSignature } = await openpgp.sign({
      message: await openpgp.cleartext.fromText(clearMessage), // CleartextMessage or Message object
      privateKeys: [privateKey],                            // for signing
      detached: true
    });

    return detachedSignature; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
  }


  /**
   * 
   * @param {*} clearMessage 
   * @param {*} detachedSignature 
   * @param {*} persona 
   */
  static async verifyMessageSigned(clearMessage, detachedSignature, persona) {
    
    let publicKeyArmored = persona.keys.publicArmored;
  
    /*
    let privateKeyArmored = receiver.keys.privateArmored; // encrypted private key
    let passphrase = receiver.passphrase; // what the private key is encrypted with
    */

    //let { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    //await privateKey.decrypt(passphrase);

    let verified = await openpgp.verify({
      message: openpgp.cleartext.fromText(clearMessage),              // CleartextMessage or Message object
      signature: await openpgp.signature.readArmored(detachedSignature), // parse detached signature
      publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys // for verification
    });
  
    /*
    let verified = await openpgp.verify({
      message: openpgp.cleartext.readArmored(signedMessage),           // parse armored message
      publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys // for verification
    });
    */

    logWrite('[verifyMessageSigned] Verified object: ' + JSON.stringify(verified));

    let { valid } = verified.signatures[0];

    if (valid) {
      logWrite('[verifyMessageSigned] Verified Signature by key ID ' + verified.signatures[0].keyid.toHex());
    } else {
      logWrite('[verifyMessageSigned] Signature could not be verified!');
    }

    return valid;
  }
  

  /**
   * Function to encode file content data to base64 encoded string.
   * Convert binary data to base64 encoded string.
   * https://stackabuse.com/encoding-and-decoding-base64-strings-in-node-js/
   * @param {*} bitmap 
   */
  static base64Encode(bitmap) {
    
    let buff = Buffer.from(bitmap);

    return buff.toString(BASE64);
  }


  /**
   * Function to create file content data from base64 encoded string.
   * Create buffer object from base64 encoded string, it is important to tell the constructor 
   * that the string is base64 encoded.
   * @param {*} base64str 
   */
  static base64Decode(base64str) {
    
    let bitmap = new Buffer(base64str, BASE64);

    logWrite('[base64Decode] bitmap.length: ' + bitmap.length);

    return bitmap;
  }


  /**
   * 
   * @param {*} beginDate 
   * @param {*} endDate 
   */
  static isBeginDateLowerEndDate(beginDate, endDate){

    if ((beginDate == undefined) || (beginDate == null)){
      logWrite('[isBeginDateLowerEndDate] Begin Date is UNDEFINED or NULL');
      return false;
    }

    if ((endDate == undefined) || (endDate == null)){
      logWrite('[isBeginDateLowerEndDate] End Date is UNDEFINED or NULL');
      return false;
    }

    var dateBegin = new Date(beginDate.toString());
    var dateEnd = new Date (endDate.toString());

    var dateDifference = (dateEnd - dateBegin);

    var decisionValue = false;

    if (dateDifference >= 0){

      logWrite('[isBeginDateLowerEndDate] Date >= Begin Date');
      decisionValue = true;
		}
		
    return decisionValue;
  }

}

module.exports = CryptoKeyUtil;

// END