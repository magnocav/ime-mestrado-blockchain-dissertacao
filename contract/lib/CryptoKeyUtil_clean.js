#!/usr/bin/env node
'use strict';

const openpgp = require('openpgp');

const HEX = 'hex';
const BASE64 = 'base64';
const ECDHTYPE = 'secp256k1';

class CryptoKeyUtil {

  static async encryptMessage(sender, clearMessage, destination) {
  
    let publicKeyArmored = destination.keys.publicArmored;
  
    let privateKeyArmored = sender.keys.privateArmored;

    let passphrase = sender.passphrase;

    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);

    const { data: encrypted } = await openpgp.encrypt({
        armor: true,
        compression: openpgp.enums.compression.zlib,
        message: await openpgp.message.fromText(clearMessage),     
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, 
        privateKeys: [privateKey]     
      });

    return encrypted;
  }


  static async decryptMessage(receiver, encryptedMessage) {
  
    let privateKeyArmored = receiver.keys.privateArmored; 
  
    let passphrase = receiver.passphrase;
  
    let { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
  
    let { data: decrypted } = await openpgp.decrypt({
      armor: true,
      compression: openpgp.enums.compression.zlib,
      message: await openpgp.message.readArmored(encryptedMessage), 
      privateKeys: [privateKey]   
    });

    return decrypted;
  }


  static async signMessage(persona, clearMessage) {
  
    let privateKeyArmored = persona.keys.privateArmored; 
    let passphrase = persona.passphrase; 

    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
  
    const { signature: detachedSignature } = await openpgp.sign({
      message: await openpgp.cleartext.fromText(clearMessage), 
      privateKeys: [privateKey], 
      detached: true
    });

    return detachedSignature; 
  }

  
  static async verifyMessageSigned(clearMessage, detachedSignature, persona) {
    
    let publicKeyArmored = persona.keys.publicArmored;
  
    let verified = await openpgp.verify({
      message: openpgp.cleartext.fromText(clearMessage),  
      signature: await openpgp.signature.readArmored(detachedSignature),
      publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys 
    });

    let { valid } = verified.signatures[0];

    return valid;
  }
  

  static isBeginDateLowerEndDate(beginDate, endDate){

    if ((beginDate == undefined) || (beginDate == null)){
      return false;
    }

    if ((endDate == undefined) || (endDate == null)){
      return false;
    }

    var dateBegin = new Date(beginDate.toString());
    var dateEnd = new Date (endDate.toString());

    var dateDifference = (dateEnd - dateBegin);

    var decisionValue = false;

    if (dateDifference >= 0){
      decisionValue = true;
		}
		
    return decisionValue;
  }

}

module.exports = CryptoKeyUtil;
